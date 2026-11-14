'use client';

import { ChartBar, DotsThree, House, Notebook, Package, Receipt, Money, Gear, UsersThree, SignOut } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { Select } from '@/components/ui/form';
import { signOut } from '@/features/auth/bootstrap';
import { useActiveMembership, useSession } from '@/features/auth/session-store';
import { cn } from '@/lib/utils';
import { SyncStatus } from './sync-status';

interface NavItem { href: string; label: string; mobileLabel: string; icon: typeof House; permission?: string; mobile: boolean }

// Guide 5.5: Overview, Sales, Inventory, Customers / Iwe Gbese, then Expenses, Reports, Staff, Settings.
const NAV: NavItem[] = [
  { href: '/app', label: 'Overview', mobileLabel: 'Home', icon: House, mobile: true, permission: 'reports.sales' },
  { href: '/app/sales', label: 'Sales', mobileLabel: 'Sales', icon: Money, mobile: true, permission: 'sales.create' },
  { href: '/app/inventory', label: 'Inventory', mobileLabel: 'Stock', icon: Package, mobile: true, permission: 'products.read' },
  { href: '/app/debts', label: 'Customers and Iwe Gbese', mobileLabel: 'Debts', icon: Notebook, mobile: true, permission: 'customers.read' },
  { href: '/app/expenses', label: 'Expenses', mobileLabel: 'Expenses', icon: Receipt, mobile: false, permission: 'expenses.read' },
  { href: '/app/reports', label: 'Reports', mobileLabel: 'Reports', icon: ChartBar, mobile: false, permission: 'reports.sales' },
  { href: '/app/staff', label: 'Staff', mobileLabel: 'Staff', icon: UsersThree, mobile: false, permission: 'members.read' },
  { href: '/app/settings', label: 'Settings', mobileLabel: 'Settings', icon: Gear, mobile: false },
];

const isActive = (path: string, href: string) => (href === '/app' ? path === '/app' : path.startsWith(href));

export function useVisibleNav() {
  const m = useActiveMembership();
  return NAV.filter((n) => !n.permission || m?.permissions.includes(n.permission));
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const nav = useVisibleNav();
  const membership = useActiveMembership();
  const memberships = useSession((s) => s.memberships);
  const mobileNav = [...nav.filter((n) => n.mobile), { href: '/app/more', label: 'More', mobileLabel: 'More', icon: DotsThree, mobile: true }];

  return (
    <div className="flex min-h-dvh bg-soft">
      {/* Persistent desktop sidebar */}
      <aside className="on-dark sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 bg-charcoal p-4 lg:flex">
        <Logo tone="light" className="px-2 pt-2" />
        {memberships.length > 1 ? (
          <Select aria-label="Active business" value={membership?.businessId} onChange={(e) => { useSession.getState().setActiveBusiness(e.target.value); router.refresh(); }} className="border-line-dark bg-charcoal-elevated text-white">
            {memberships.map((m) => <option key={m.businessId} value={m.businessId}>{m.businessName}</option>)}
          </Select>
        ) : (
          <p className="title-4 truncate px-2 text-mist">{membership?.businessName}</p>
        )}
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {nav.map((n) => {
            const active = isActive(path, n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
                className={cn('title-4 flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 transition-oja', active ? 'bg-royal text-white' : 'text-mist hover:bg-charcoal-elevated hover:text-white')}>
                <n.icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={async () => { await signOut(); router.replace('/'); }} className="title-4 flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-mist transition-oja hover:bg-charcoal-elevated hover:text-white">
          <SignOut size={20} aria-hidden /> Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2 lg:px-8">
          <span className="title-3 truncate text-ink lg:hidden">{membership?.businessName}</span>
          <span className="hidden lg:block" />
          <SyncStatus />
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Compact phone navigation */}
      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobileNav.map((n) => {
          const active = n.href === '/app/more' ? ['/app/more', '/app/expenses', '/app/reports', '/app/staff', '/app/settings', '/app/sync'].some((p) => path.startsWith(p)) : isActive(path, n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
              className={cn('caption-3 flex min-h-14 flex-col items-center justify-center gap-0.5 transition-oja', active ? 'text-royal' : 'text-muted')}>
              <n.icon size={24} weight={active ? 'fill' : 'regular'} aria-hidden />
              {n.mobileLabel}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
