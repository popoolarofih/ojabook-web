'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-reduced-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/logo';
import { buttonStyles } from '@/components/ui/button';
import { navLinks } from '@/content/landing';
import { cn } from '@/lib/utils';
import { EASE } from './motion';

/** Which landing section is on screen, via IntersectionObserver (never a scroll listener). */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

/** Two drawn lines that turn into a cross. Transform only, on the base curve. */
function MenuIcon({ open }: { open: boolean }) {
  const reduce = useReducedMotion();
  const t = { duration: reduce ? 0 : 0.5, ease: EASE };
  return (
    <span className="relative block size-6" aria-hidden>
      <motion.span className="absolute left-1 top-2 block h-0.5 w-4 rounded-full bg-white" animate={{ y: open ? 3 : 0, rotate: open ? 45 : 0 }} transition={t} />
      <motion.span className="absolute left-1 top-4 block h-0.5 w-4 rounded-full bg-white" animate={{ y: open ? -3 : 0, rotate: open ? -45 : 0 }} transition={t} />
    </span>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const active = useActiveSection(navLinks.map((l) => l.id));

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {/* Resting state: a compact bar floating off the top edge, translucent over a blur. */}
      <header className="on-dark fixed inset-x-0 top-3 z-50 mx-auto flex w-[calc(100%-2rem)] items-center justify-between gap-6 rounded-2xl border border-white/10 bg-charcoal/70 px-3 py-2 backdrop-blur-md md:w-fit">
        <Link href="/" aria-current="page" aria-label="OjaBook home">
          <Logo tone="light" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-current={active === l.id ? 'location' : undefined}
              className={cn('button-sm rounded-lg px-3 py-2 text-mist transition-oja hover:text-white', active === l.id && 'bg-charcoal-elevated text-white')}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="button-sm rounded-lg px-3 py-2 text-white transition-oja hover:bg-charcoal-elevated">
            Sign in
          </Link>
          <Link href="/login" className={buttonStyles({ variant: 'primary', size: 'sm' })}>
            Get started free
          </Link>
        </div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg transition-oja hover:bg-charcoal-elevated md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
      </header>

      {/* Mobile menu: a full height panel, strong blur, links arriving one after another. */}
      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="on-dark fixed inset-0 z-40 flex flex-col gap-3 bg-charcoal/95 px-6 pb-8 pt-24 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {[...navLinks.map((l) => ({ href: `#${l.id}`, label: l.label })), { href: '/login', label: 'Sign in' }].map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="heading-5 border-b border-line-dark py-3 text-white"
                initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                // Each link steps 60ms after the previous one, and the whole sequence stays within 400ms.
                transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : Math.min(i * 0.06, 0.4) }}
              >
                {l.label}
              </motion.a>
            ))}
            <motion.div
              className="mt-auto"
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.4 }}
            >
              <Link href="/login" onClick={() => setOpen(false)} className={buttonStyles({ variant: 'accent', size: 'lg', block: true })}>
                Get started free
              </Link>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
