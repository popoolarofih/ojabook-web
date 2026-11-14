'use client';

import { motion } from 'framer-motion';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-reduced-motion';
import type { ReactNode } from 'react';

/** The base curve from the design skill: weighted, decelerating into place. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll reveal: rises 32px and fades in over 700ms, once. whileInView uses IntersectionObserver,
 * so there is no scroll listener. With reduced motion it is a plain opacity change.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

/** A slow, small float for product cards in the hero. Transform only, off for reduced motion. */
export function Float({ children, className, offset = 8, duration = 6 }: { children: ReactNode; className?: string; offset?: number; duration?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} animate={reduce ? undefined : { y: [0, -offset, 0] }} transition={{ duration, ease: 'easeInOut', repeat: Infinity }}>
      {children}
    </motion.div>
  );
}
