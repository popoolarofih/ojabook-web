'use client';

import { useEffect, useState } from 'react';

/**
 * The user's reduced motion preference, kept in sync after hydration. Framer Motion's own hook
 * reads the value once during the first render, which is before hydration on the server, so it
 * can report the wrong answer. This one reads the media query after mount and follows changes.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduce;
}
