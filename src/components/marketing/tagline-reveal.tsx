'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-reduced-motion';
import { cn } from '@/lib/utils';

/**
 * Tagline reveal (skill B11). Words start at about 30% opacity and become full colour one at a
 * time, in reading order, as each crosses a trigger line 60% of the way down the viewport.
 * One IntersectionObserver watches every word. There is no scroll listener.
 * With reduced motion the finished text is shown at once.
 */
export function TaglineReveal({ text, className }: { text: string; className?: string }) {
  const words = useMemo(() => text.split(' '), [text]);
  const reduce = useReducedMotion();
  const [lit, setLit] = useState<ReadonlySet<number>>(new Set());
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (reduce) return;
    const io = new IntersectionObserver(
      (entries) => {
        setLit((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            const i = Number((e.target as HTMLElement).dataset.i);
            // Above the trigger line (already passed) stays lit. Below it (not reached yet) goes dim.
            const below = e.boundingClientRect.top > (e.rootBounds?.bottom ?? 0);
            if (e.isIntersecting || !below) next.add(i);
            else next.delete(i);
          }
          return next;
        });
      },
      { rootMargin: '0px 0px -40% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [reduce, words.length]);

  return (
    <p className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          data-i={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cn('inline-block transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]', reduce || lit.has(i) ? 'opacity-100' : 'opacity-30')}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
