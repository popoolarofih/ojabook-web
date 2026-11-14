import { ArrowsClockwise, CheckCircle, Warning, WifiSlash } from '@phosphor-icons/react/dist/ssr';
import { debts, demo, inventory, quickSale } from '@/content/landing';
import { cn } from '@/lib/utils';

/** Every preview is built from HTML so it stays sharp, loads fast and is labelled as demonstration data. */
export function DemoBadge({ dark }: { dark?: boolean }) {
  return (
    <span className={cn('caption-3 inline-flex rounded-full px-2 py-1', dark ? 'bg-charcoal-elevated text-mist' : 'bg-soft text-muted')}>
      {demo.label}
    </span>
  );
}

/** Outer radius 24px with 8px padding gives the screen an inner radius of 16px (skill B3). */
export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-3xl bg-charcoal-elevated p-2', className)}>
      <div className="overflow-hidden rounded-2xl bg-white">{children}</div>
    </div>
  );
}

export function QuickSaleScreen() {
  return (
    <div className="flex flex-col text-ink">
      <div className="flex items-center justify-between bg-charcoal px-4 py-3 text-white">
        <span className="title-4">Quick Sale</span>
        <span className="caption-3 rounded-full bg-royal px-2 py-1">3 items</span>
      </div>
      <ul className="flex flex-col divide-y divide-line px-4">
        {quickSale.cart.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-3 py-3">
            <div className="flex flex-col">
              <span className="body-5">{c.name}</span>
              <span className="caption-2 text-muted">{c.detail}</span>
            </div>
            <span className="body-4 tabular">{c.amount}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 bg-soft p-4">
        <div className="flex items-center justify-between">
          <span className="body-5 text-muted">Total</span>
          <span className="heading-6 tabular">{quickSale.total}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Cash', 'Transfer', 'Credit'].map((m, i) => (
            <span key={m} className={cn('button-sm rounded-lg py-2 text-center', i === 0 ? 'bg-royal text-white' : 'border border-line bg-white text-ink')}>
              {m}
            </span>
          ))}
        </div>
        <span className="button-md rounded-lg bg-royal py-3 text-center text-white">Charge {quickSale.total}</span>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const cards = [
    ['Sales', demo.revenue, 'Recorded today'],
    ['Collected', demo.collected, 'Money received'],
    ['Owed to you', demo.owed, 'Unpaid credit'],
    ['Net operating profit', demo.profit, 'After expenses'],
  ];
  return (
    <div className="rounded-3xl border border-line bg-white p-2 md:p-2">
      <div className="flex flex-col gap-4 rounded-2xl bg-soft p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="title-3 text-ink">Overview</span>
          <DemoBadge />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map(([label, value, hint]) => (
            <div key={label} className="flex flex-col gap-1 rounded-2xl bg-white p-4">
              <span className="caption-1 text-muted">{label}</span>
              <span className="heading-6 tabular text-ink">{value}</span>
              <span className="caption-5 text-muted">{hint}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 lg:col-span-2">
            <span className="title-4 text-ink">Sales this week</span>
            <div className="flex h-40 items-stretch gap-2" role="img" aria-label="Bar chart of demonstration sales for the week, rising towards the weekend">
              {demo.bars.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  {/* The track has a fixed height, so the percentage height of the bar resolves. */}
                  <div className="flex w-full flex-1 items-end">
                    <div className={cn('w-full rounded-lg', i === demo.bars.length - 1 ? 'bg-royal' : 'bg-royal-tint')} style={{ height: `${h}%` }} />
                  </div>
                  <span className="caption-5 text-muted">{demo.days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4">
            <span className="title-4 text-ink">Low stock</span>
            {demo.lowStock.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-2">
                <span className="body-6 text-ink">{s.name}</span>
                <span className="caption-3 shrink-0 rounded-full bg-warning-tint px-2 py-1 text-warning-ink">{s.left}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryPreview() {
  return (
    <div className="rounded-3xl border border-line bg-white p-2">
      <div className="flex flex-col gap-3 rounded-2xl bg-soft p-4">
        <div className="flex items-center justify-between">
          <span className="title-3 text-ink">Stock</span>
          <DemoBadge />
        </div>
        <ul className="flex flex-col gap-2">
          {inventory.rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
              <div className="flex flex-col">
                <span className="body-5 text-ink">{r.name}</span>
                <span className="caption-2 text-muted">Sells by the {r.unit}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="body-4 tabular text-ink">{r.left}</span>
                <span className={cn('caption-3 rounded-full px-2 py-1', r.state === 'Low stock' ? 'bg-warning-tint text-warning-ink' : 'bg-success-tint text-success-ink')}>{r.state}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DebtsPreview() {
  return (
    <div className="rounded-3xl border border-line bg-white p-2">
      <div className="flex flex-col gap-3 rounded-2xl bg-soft p-4">
        <div className="flex items-center justify-between">
          <span className="title-3 text-ink">Iwe Gbese</span>
          <DemoBadge />
        </div>
        <ul className="flex flex-col gap-2">
          {debts.customers.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
              <div className="flex flex-col">
                <span className="body-5 text-ink">{c.name}</span>
                <span className={cn('caption-3 w-fit rounded-full px-2 py-1', c.tone === 'orange' ? 'bg-warning-tint text-warning-ink' : 'bg-royal-tint text-royal-deep')}>{c.note}</span>
              </div>
              <span className="heading-6 tabular text-ink">{c.owes}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <span className="button-sm flex-1 rounded-lg bg-royal py-2 text-center text-white">Record repayment</span>
          <span className="button-sm flex-1 rounded-lg border border-line bg-white py-2 text-center text-ink">Share statement</span>
        </div>
      </div>
    </div>
  );
}

const stateIcons = [
  { icon: WifiSlash, tone: 'bg-warning-tint text-warning-ink' },
  { icon: ArrowsClockwise, tone: 'bg-royal-tint text-royal-deep' },
  { icon: CheckCircle, tone: 'bg-success-tint text-success-ink' },
];

/** Sync states always pair an icon with words, never colour alone. */
export function SyncStatesPreview({ states }: { states: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {states.map((s, i) => {
        const meta = stateIcons[i] ?? { icon: Warning, tone: 'bg-danger-tint text-danger' };
        const Icon = meta.icon;
        return (
          <li key={s} className={cn('caption-1 inline-flex items-center gap-2 rounded-full px-3 py-2', meta.tone)}>
            <Icon size={16} weight="bold" aria-hidden />
            {s}
          </li>
        );
      })}
    </ul>
  );
}
