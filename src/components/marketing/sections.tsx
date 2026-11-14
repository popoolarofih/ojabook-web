import { ArrowRight, CheckCircle, DeviceMobile, DeviceTablet, Laptop, Money, Notebook, Package, Receipt, ChartBar, ShieldCheck, X } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonStyles } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { capabilities, debts, devices, faq, features, finalCta, footer, hero, howItWorks, inventory, problem, quickSale, tagline, trust } from '@/content/landing';
import { cn } from '@/lib/utils';
import { Float, Reveal } from './motion';
import { DashboardPreview, DebtsPreview, DemoBadge, InventoryPreview, PhoneFrame, QuickSaleScreen, SyncStatesPreview } from './previews';
import { TaglineReveal } from './tagline-reveal';

const featureIcons = { cash: Money, package: Package, notebook: Notebook, receipt: Receipt, chart: ChartBar } as const;

function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <span className={cn('caption-3 uppercase tracking-wide', dark ? 'text-orange' : 'text-royal')}>{children}</span>;
}

function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn('scroll-mt-24 px-4 py-16 md:px-8 md:py-24', className)}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/** Two column block that alternates sides on desktop, stacking text first on phones. */
function Showcase({ id, eyebrow, title, body, visual, flip, extra }: { id?: string; eyebrow: string; title: string; body: string; visual: ReactNode; flip?: boolean; extra?: ReactNode }) {
  return (
    <Section id={id}>
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <Reveal className={cn('flex flex-col gap-4', flip && 'md:order-2')}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="heading-3 max-w-[680px] text-ink">{title}</h2>
          <p className="body-3 max-w-[680px] text-muted">{body}</p>
          {extra}
        </Reveal>
        <Reveal delay={0.1} className={cn(flip && 'md:order-1')}>
          {visual}
        </Reveal>
      </div>
    </Section>
  );
}

export function Hero() {
  return (
    <section className="on-dark relative overflow-hidden bg-charcoal px-4 pb-16 pt-24 text-white md:px-8 md:pb-24 md:pt-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          {/* Heading and subheading are capped at 680px. Breaks follow the thought, not the width. */}
          <h1
            className="heading-1 max-w-[680px] bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #FFFFFF, #9B9B9B)' }}
          >
            Your business.
            <br className="hidden sm:block" /> Your numbers.
            <br className="hidden sm:block" /> Your control.
          </h1>
          <p className="body-3 max-w-[680px] text-mist md:text-lg">{hero.subheadline}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/login" className={buttonStyles({ variant: 'accent', size: 'lg' })}>
              {hero.primaryCta}
              <ArrowRight size={20} weight="bold" aria-hidden />
            </Link>
            <a href="#features" className="button-md inline-flex min-h-12 items-center justify-center rounded-lg px-4 py-3 text-white transition-oja hover:bg-charcoal-elevated">
              {hero.secondaryCta}
            </a>
          </div>
          <p className="caption-2 flex max-w-[680px] items-start gap-2 text-mist">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-orange" aria-hidden />
            {hero.proof}
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-3 lg:max-w-none xl:items-end">
          <Float className="w-full max-w-xs" offset={6} duration={7}>
            <PhoneFrame className="shadow-[0_24px_64px_rgba(16,91,255,0.25)]">
              <QuickSaleScreen />
            </PhoneFrame>
          </Float>
          <Float className="absolute left-0 top-12 hidden w-40 xl:block" offset={10} duration={5.5}>
            <div className="flex flex-col gap-1 rounded-2xl border border-line-dark bg-charcoal-elevated p-4 shadow-[0_0_32px_rgba(254,133,0,0.18)]">
              <span className="caption-1 text-orange">Low stock</span>
              <span className="body-5 text-white">Peak Milk Tin 160g</span>
              <span className="caption-2 text-mist">11 tins left</span>
            </div>
          </Float>
          <Float className="absolute bottom-24 left-0 hidden w-40 xl:block" offset={8} duration={6.5}>
            <div className="flex flex-col gap-1 rounded-2xl border border-line-dark bg-charcoal-elevated p-4">
              <span className="caption-1 text-mist">Receipt R-000214</span>
              <span className="heading-6 tabular text-white">₦106,550</span>
              <span className="caption-3 w-fit rounded-full bg-royal px-2 py-1 text-white">Saved on this device</span>
            </div>
          </Float>
          <DemoBadge dark />
        </div>
      </div>
    </section>
  );
}

export function CapabilityStrip() {
  return (
    <section aria-label="What makes OjaBook dependable" className="border-b border-line bg-white px-4 py-8 md:px-8">
      <ul className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-3">
        {capabilities.map((c) => (
          <li key={c.title} className="flex items-start gap-3">
            <CheckCircle size={24} weight="fill" className="mt-0.5 shrink-0 text-royal" aria-hidden />
            <div className="flex flex-col gap-1">
              <span className="title-3 text-ink">{c.title}</span>
              <span className="body-6 text-muted">{c.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProblemSolution() {
  return (
    <Section className="bg-soft">
      <Reveal className="flex flex-col gap-4">
        <Eyebrow>{problem.eyebrow}</Eyebrow>
        <h2 className="heading-3 max-w-[680px] text-ink">{problem.title}</h2>
        <p className="body-3 max-w-[680px] text-muted">{problem.body}</p>
      </Reveal>
      <Reveal delay={0.1} className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
          <span className="title-3 text-muted">Without OjaBook</span>
          <ul className="flex flex-col gap-3">
            {problem.before.map((b) => (
              <li key={b} className="body-5 flex items-center gap-3 text-ink">
                <X size={20} weight="bold" className="shrink-0 text-danger" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-royal bg-royal-tint p-6">
          <span className="title-3 text-royal-deep">With OjaBook</span>
          <ul className="flex flex-col gap-3">
            {problem.after.map((a) => (
              <li key={a} className="body-5 flex items-center gap-3 text-ink">
                <CheckCircle size={20} weight="fill" className="shrink-0 text-royal" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}

export function TaglineSection() {
  return (
    <Section className="bg-white py-24 md:py-24">
      <div className="max-w-[680px]">
        <TaglineReveal text={tagline} className="heading-3 text-ink" />
      </div>
    </Section>
  );
}

export function FeatureCards() {
  return (
    <Section id="features" className="bg-soft">
      <Reveal className="flex flex-col gap-4">
        <Eyebrow>Everything in one place</Eyebrow>
        <h2 className="heading-3 max-w-[680px] text-ink">The five jobs of a small business, done in one app.</h2>
      </Reveal>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = featureIcons[f.icon];
          return (
            <li key={f.id}>
              <Reveal delay={i * 0.06} className="h-full">
                <div className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-white p-6 transition-oja hover:-translate-y-1 hover:border-royal">
                  <span className="flex size-12 items-center justify-center rounded-lg bg-royal-tint text-royal">
                    <Icon size={24} weight="duotone" aria-hidden />
                  </span>
                  <h3 className="heading-6 text-ink">{f.title}</h3>
                  <p className="body-6 text-muted">{f.body}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function DashboardShowcase() {
  return (
    <Section id="dashboard" className="bg-white">
      <Reveal className="mb-12 flex flex-col gap-4">
        <Eyebrow>Dashboard</Eyebrow>
        <h2 className="heading-3 max-w-[680px] text-ink">See sales, money received and money owed side by side.</h2>
        <p className="body-3 max-w-[680px] text-muted">Revenue is not cash. OjaBook shows both, with a clear meaning for every figure, so a credit sale never looks like money in your hand.</p>
      </Reveal>
      <Reveal delay={0.1}>
        <DashboardPreview />
      </Reveal>
    </Section>
  );
}

export function QuickSaleShowcase() {
  return (
    <Showcase
      id="quick-sale"
      eyebrow={quickSale.eyebrow}
      title={quickSale.title}
      body={quickSale.body}
      extra={
        <ol className="mt-2 flex flex-col gap-4">
          {quickSale.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="button-sm flex size-8 shrink-0 items-center justify-center rounded-full bg-royal text-white" aria-hidden>
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <span className="title-3 text-ink">{s.title}</span>
                <span className="body-6 text-muted">{s.body}</span>
              </div>
            </li>
          ))}
        </ol>
      }
      visual={
        <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
          <PhoneFrame className="w-full">
            <QuickSaleScreen />
          </PhoneFrame>
          <DemoBadge />
        </div>
      }
    />
  );
}

export function InventoryShowcase() {
  return <Showcase flip eyebrow={inventory.eyebrow} title={inventory.title} body={inventory.body} visual={<InventoryPreview />} />;
}

export function DebtsShowcase() {
  return <Showcase eyebrow={debts.eyebrow} title={debts.title} body={debts.body} visual={<DebtsPreview />} />;
}

export function DevicesSection() {
  const frames = [
    { icon: DeviceMobile, label: 'Phone', note: 'Large buttons, few steps' },
    { icon: DeviceTablet, label: 'Tablet', note: 'Counter top selling' },
    { icon: Laptop, label: 'Desktop', note: 'Wide reports and stock' },
  ];
  return (
    <Section id="devices" className="on-dark bg-charcoal text-white">
      <Reveal className="flex flex-col gap-4">
        <Eyebrow dark>{devices.eyebrow}</Eyebrow>
        <h2 className="heading-3 max-w-[680px] text-white">{devices.title}</h2>
        <p className="body-3 max-w-[680px] text-mist">{devices.body}</p>
      </Reveal>
      <Reveal delay={0.1} className="mt-12 grid gap-4 md:grid-cols-3">
        {frames.map(({ icon: Icon, label, note }) => (
          <div key={label} className="flex flex-col gap-3 rounded-2xl border border-line-dark bg-charcoal-elevated p-6">
            <Icon size={32} weight="duotone" className="text-orange" aria-hidden />
            <span className="heading-6 text-white">{label}</span>
            <span className="body-6 text-mist">{note}</span>
          </div>
        ))}
      </Reveal>
      <Reveal delay={0.15} className="mt-4 flex flex-col gap-4 rounded-2xl border border-line-dark bg-charcoal-elevated p-6 md:p-8">
        <h3 className="heading-5 text-white">{devices.offlineTitle}</h3>
        <p className="body-3 max-w-[680px] text-mist">{devices.offlineBody}</p>
        <SyncStatesPreview states={devices.states} />
      </Reveal>
    </Section>
  );
}

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-white">
      <Reveal>
        <h2 className="heading-3 max-w-[680px] text-ink">{howItWorks.title}</h2>
      </Reveal>
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {howItWorks.steps.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={i * 0.08} className="h-full">
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-soft p-6">
                <span className="heading-5 text-royal tabular" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="heading-6 text-ink">{s.title}</h3>
                <p className="body-6 text-muted">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function TrustSection() {
  return (
    <Section className="bg-soft">
      <Reveal className="flex flex-col gap-4">
        <h2 className="heading-3 max-w-[680px] text-ink">{trust.title}</h2>
        <p className="body-3 max-w-[680px] text-muted">{trust.body}</p>
      </Reveal>
      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {trust.points.map((p, i) => (
          <li key={p.title}>
            <Reveal delay={i * 0.06} className="h-full">
              <div className="flex h-full gap-4 rounded-2xl border border-line bg-white p-6">
                <ShieldCheck size={28} weight="duotone" className="shrink-0 text-royal" aria-hidden />
                <div className="flex flex-col gap-1">
                  <h3 className="title-2 text-ink">{p.title}</h3>
                  <p className="body-6 text-muted">{p.body}</p>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function FaqSection() {
  return (
    <Section id="faq" className="bg-white">
      <Reveal>
        <h2 className="heading-3 max-w-[680px] text-ink">Questions people ask first</h2>
      </Reveal>
      <div className="mt-12 flex max-w-3xl flex-col gap-3">
        {faq.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-line bg-soft p-4 transition-oja open:bg-white open:border-royal">
            <summary className="title-2 flex cursor-pointer list-none items-center justify-between gap-4 text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden className="relative block size-6 shrink-0">
                <span className="absolute left-1 top-3 block h-0.5 w-4 rounded-full bg-royal" />
                <span className="absolute left-1 top-3 block h-0.5 w-4 rotate-90 rounded-full bg-royal transition-oja group-open:rotate-0" />
              </span>
            </summary>
            <p className="body-3 mt-3 text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="on-dark bg-charcoal px-4 py-16 md:px-8 md:py-24">
      <Reveal className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6">
        <h2 className="heading-2 max-w-[680px] text-white">{finalCta.title}</h2>
        <p className="body-3 max-w-[680px] text-mist md:text-lg">{finalCta.body}</p>
        <Link href="/login" className={buttonStyles({ variant: 'accent', size: 'lg' })}>
          {finalCta.cta}
          <ArrowRight size={20} weight="bold" aria-hidden />
        </Link>
        <p className="caption-2 text-mist">{finalCta.reassurance}</p>
      </Reveal>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="on-dark border-t border-line-dark bg-charcoal px-4 py-12 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo tone="light" />
          <p className="body-6 text-mist">{footer.tagline}</p>
          <p className="caption-2 text-mist">{footer.legalNote}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3 md:items-end">
          <Link href="/login" className="body-5 text-white transition-oja hover:text-orange">Sign in</Link>
          <Link href="/privacy" className="body-5 text-white transition-oja hover:text-orange">Privacy policy</Link>
          <Link href="/terms" className="body-5 text-white transition-oja hover:text-orange">Terms of use</Link>
        </nav>
      </div>
    </footer>
  );
}
