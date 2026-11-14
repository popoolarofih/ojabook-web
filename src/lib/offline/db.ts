import Dexie, { type Table } from 'dexie';
import type { Schemas } from '@/lib/api/client';

/**
 * Local structured data (guide 9.1). Holds the POS catalogue, customers and the queue of
 * operations waiting to sync. It never holds tokens, passwords or other credentials.
 */
export type OpStatus = 'LOCAL_PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED_RETRYABLE' | 'FAILED_FINAL' | 'DISMISSED';
export type OpType = 'sale.create' | 'customer.create' | 'repayment.create' | 'expense.create';

export interface LocalOp {
  id: string;
  businessId: string;
  userId: string;
  type: OpType;
  /** Id of the thing being created, for example the sale id. Lets screens find their operation. */
  entityId: string;
  payload: Record<string, unknown>;
  /** A short human label, for example "Sale of ₦3,000". */
  summary: string;
  amountKobo?: number;
  clientCreatedAt: string;
  status: OpStatus;
  attempts: number;
  nextAttemptAt: number;
  errorCode?: string;
  message?: string;
  details?: unknown;
  result?: unknown;
}

export type CachedProduct = Schemas['ProductDto'] & { businessId: string };
export type CachedCustomer = { id: string; businessId: string; name: string; phone: string | null; outstandingKobo: number };

class OjaDb extends Dexie {
  ops!: Table<LocalOp, string>;
  products!: Table<CachedProduct, string>;
  customers!: Table<CachedCustomer, string>;

  constructor() {
    super('ojabook');
    this.version(1).stores({
      ops: 'id, businessId, status, entityId, clientCreatedAt',
      products: 'id, businessId, name',
      customers: 'id, businessId, name',
    });
  }
}

export const db = new OjaDb();

export async function clearLocalData() {
  await Promise.all([db.ops.clear(), db.products.clear(), db.customers.clear()]);
}
