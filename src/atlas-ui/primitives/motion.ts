import type { Transition } from 'framer-motion';

export const MOTION = {
  drawerSpring: { type: 'spring', stiffness: 320, damping: 30 } satisfies Transition,
  drawerExit: { duration: 0.18, ease: 'easeIn' } satisfies Transition,
  pageFade: { duration: 0.18, ease: 'easeOut' } satisfies Transition,
  pinPop: { type: 'spring', stiffness: 500, damping: 22 } satisfies Transition,
  hover: { duration: 0.12, ease: 'easeOut' } satisfies Transition,
} as const;
