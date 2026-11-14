import { api, ApiError, errorMessage, refreshSession, unwrap, type Schemas } from '@/lib/api/client';
import { useSession } from '@/features/auth/session-store';
import { formatNgn } from '@/lib/money';
import { db, type CachedCustomer, type CachedProduct, type LocalOp, type OpType } from './db';
import { applyLines } from './stock-math';

/**
 * Offline queue and synchronisation (guide section 9).
 *  - An operation is written to IndexedDB BEFORE the user is told it was saved.
 *  - Sync runs on startup, when the browser comes online, when the app becomes visible,
 *    every 30 seconds while something is waiting, and on demand. Browser background sync is
 *    optional and never the only mechanism.
 *  - The operation id is the idempotency key, so a retry after an unknown outcome is safe.
 *  - Conflicts are kept and shown. They are never discarded or last write wins.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
/** Screens subscribe to refetch server data after something synced. */
export const onSynced = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const notify = () => listeners.forEach((fn) => fn());

const BATCH = 20;
const MAX_BACKOFF_MS = 5 * 60_000;

export const backoffMs = (attempts: number, random = Math.random()): number =>
  Math.min(MAX_BACKOFF_MS, 5_000 * 2 ** Math.max(0, attempts - 1)) * (0.75 + random * 0.5);

export function newId(): string {
  return crypto.randomUUID();
}

export async function enqueueOp(input: {
  type: OpType;
  entityId: string;
  payload: Record<string, unknown>;
  summary: string;
  amountKobo?: number;
  clientCreatedAt?: string;
}): Promise<LocalOp> {
  const { activeBusinessId, user } = useSession.getState();
  if (!activeBusinessId || !user) throw new Error('Sign in to record this.');
  const op: LocalOp = {
    id: newId(),
    businessId: activeBusinessId,
    userId: user.id,
    type: input.type,
    entityId: input.entityId,
    payload: input.payload,
    summary: input.summary,
    amountKobo: input.amountKobo,
    clientCreatedAt: input.clientCreatedAt ?? new Date().toISOString(),
    status: 'LOCAL_PENDING',
    attempts: 0,
    nextAttemptAt: 0,
  };
  await db.transaction('rw', db.ops, db.products, async () => {
    await db.ops.add(op); // persisted first
    if (op.type === 'sale.create') {
      const items = (op.payload.items as { productId: string; quantity: string; unitId?: string }[]) ?? [];
      const ids = items.map((i) => i.productId);
      const cached = await db.products.bulkGet(ids);
      const updated = applyLines(cached.filter(Boolean) as CachedProduct[], items, -1);
      await db.products.bulkPut(updated);
    }
  });
  void syncNow();
  return op;
}

let running = false;

export async function syncNow(): Promise<void> {
  if (running || typeof navigator === 'undefined' || !navigator.onLine) return;
  const { activeBusinessId } = useSession.getState();
  if (!activeBusinessId) return;
  running = true;
  // A session restored while offline has no token yet. Get one first, or wait for the next trigger.
  if (!useSession.getState().accessToken && (await refreshSession()) !== 'ok') {
    running = false;
    return;
  }
  try {
    for (;;) {
      const now = Date.now();
      const due = (
        await db.ops
          .where('businessId')
          .equals(activeBusinessId)
          .filter((o) => (o.status === 'LOCAL_PENDING' || o.status === 'FAILED_RETRYABLE') && o.nextAttemptAt <= now)
          .toArray()
      )
        .sort((a, b) => a.clientCreatedAt.localeCompare(b.clientCreatedAt))
        .slice(0, BATCH);
      if (due.length === 0) break;
      const progressed = await sendBatch(due);
      if (!progressed) break;
    }
  } finally {
    running = false;
  }
}

async function sendBatch(ops: LocalOp[]): Promise<boolean> {
  await db.ops.bulkPut(ops.map((o) => ({ ...o, status: 'SYNCING' as const })));
  let results: Schemas['SyncOperationResult'][];
  try {
    const body = await unwrap(
      api.POST('/api/v1/sync/operations', {
        body: {
          operations: ops.map((o) => ({ id: o.id, type: o.type, payload: o.payload, clientCreatedAt: o.clientCreatedAt })),
        },
      }),
    );
    results = body.results;
  } catch (e) {
    // Network loss or a server error: keep the records and retry later with backoff.
    const final = e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 429;
    await db.ops.bulkPut(
      ops.map((o) => ({
        ...o,
        status: final ? ('FAILED_FINAL' as const) : ('FAILED_RETRYABLE' as const),
        attempts: o.attempts + 1,
        nextAttemptAt: Date.now() + backoffMs(o.attempts + 1),
        errorCode: e instanceof ApiError ? e.code : 'NETWORK',
        message: errorMessage(e),
      })),
    );
    if (e instanceof ApiError && e.status === 401) await refreshSession();
    return false;
  }

  const byId = new Map(results.map((r) => [r.id, r]));
  await db.ops.bulkPut(
    ops.map((o) => {
      const r = byId.get(o.id);
      if (!r) return { ...o, status: 'FAILED_RETRYABLE' as const, attempts: o.attempts + 1, nextAttemptAt: Date.now() + backoffMs(o.attempts + 1) };
      return {
        ...o,
        status: r.status,
        attempts: o.attempts + 1,
        nextAttemptAt: r.status === 'FAILED_RETRYABLE' ? Date.now() + backoffMs(o.attempts + 1) : 0,
        errorCode: r.errorCode,
        message: r.message,
        details: r.details,
        result: r.result,
      };
    }),
  );
  await refreshLocalCaches();
  notify();
  return true;
}

// ───────────── caches ─────────────

/** Refresh the POS catalogue and customers, then re-apply stock still pending locally. */
export async function refreshLocalCaches(): Promise<void> {
  const businessId = useSession.getState().activeBusinessId;
  if (!businessId || !navigator.onLine) return;
  try {
    const [catalogue, customers] = await Promise.all([
      unwrap(api.GET('/api/v1/products/pos-catalogue', { params: { query: {} } })),
      unwrap(api.GET('/api/v1/customers', { params: { query: { pageSize: 100 } } })).catch(() => null),
    ]);
    const pending = await db.ops
      .where('businessId')
      .equals(businessId)
      .filter((o) => o.type === 'sale.create' && ['LOCAL_PENDING', 'SYNCING', 'FAILED_RETRYABLE'].includes(o.status))
      .toArray();
    const lines = pending.flatMap((o) => (o.payload.items as { productId: string; quantity: string; unitId?: string }[]) ?? []);
    const withPending = applyLines(catalogue.filter((p) => p.status === 'ACTIVE').map((p) => ({ ...p, businessId })), lines, -1);
    await db.transaction('rw', db.products, db.customers, async () => {
      await db.products.where('businessId').equals(businessId).delete();
      await db.products.bulkPut(withPending);
      if (customers) {
        const pendingCustomers = await db.customers.where('businessId').equals(businessId).filter((c) => c.outstandingKobo === -1).toArray();
        await db.customers.where('businessId').equals(businessId).delete();
        await db.customers.bulkPut([
          ...customers.items.map((c): CachedCustomer => ({ id: c.id, businessId, name: c.name, phone: c.phone, outstandingKobo: c.outstandingKobo })),
          ...pendingCustomers,
        ]);
      }
    });
  } catch {
    /* offline or not permitted: the previous cache keeps working */
  }
}

/** Customers created offline appear immediately. outstandingKobo -1 marks "not synced yet". */
export async function cacheLocalCustomer(c: { id: string; name: string; phone: string | null }) {
  const businessId = useSession.getState().activeBusinessId;
  if (!businessId) return;
  await db.customers.put({ ...c, businessId, outstandingKobo: -1 });
}

export const describeSale = (totalKobo: number) => `Sale of ${formatNgn(totalKobo)}`;

// ───────────── triggers ─────────────

/** Start every sync trigger. Returns a cleanup function. */
export function startSyncEngine(): () => void {
  void (async () => {
    // An operation left SYNCING means the tab closed mid flight. Retrying is safe: ids are idempotency keys.
    const stuck = await db.ops.where('status').equals('SYNCING').toArray();
    if (stuck.length) await db.ops.bulkPut(stuck.map((o) => ({ ...o, status: 'FAILED_RETRYABLE' as const, nextAttemptAt: 0 })));
    await refreshLocalCaches();
    await syncNow();
  })();

  const onOnline = () => void syncNow().then(refreshLocalCaches);
  const onVisible = () => {
    if (document.visibilityState === 'visible') void syncNow();
  };
  const timer = window.setInterval(() => void syncNow(), 30_000);
  const onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'ojabook-sync') void syncNow();
  };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  navigator.serviceWorker?.addEventListener('message', onMessage);
  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    navigator.serviceWorker?.removeEventListener('message', onMessage);
    window.clearInterval(timer);
  };
}

/** Ask for a background sync where the browser supports it. Optional, never relied on. */
export async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    const sync = (reg as unknown as { sync?: { register: (tag: string) => Promise<void> } } | undefined)?.sync;
    await sync?.register('ojabook-sync');
  } catch {
    /* unsupported */
  }
}
