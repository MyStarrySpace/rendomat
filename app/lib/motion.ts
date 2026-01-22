/**
 * Motion Design System
 *
 * Reusable Framer Motion variants following motion design principles:
 * - Natural spring physics for organic movement
 * - Purposeful timing (150-300ms micro, 300-500ms macro)
 * - Staggered children for visual hierarchy
 * - Directional entrance based on content flow
 */

import { Variants, Transition } from "framer-motion";

// =============================================================================
// TIMING & EASING
// =============================================================================

export const spring = {
  gentle: { type: "spring", stiffness: 120, damping: 14 },
  snappy: { type: "spring", stiffness: 300, damping: 20 },
  bouncy: { type: "spring", stiffness: 400, damping: 10 },
  smooth: { type: "spring", stiffness: 100, damping: 20 },
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  in: [0.4, 0, 1, 1],
  inOut: [0.4, 0, 0.2, 1],
} as const;

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: ease.out,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: ease.in,
    },
  },
};

// =============================================================================
// CONTAINER ANIMATIONS (for staggering children)
// =============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

// =============================================================================
// ITEM ANIMATIONS (children of stagger containers)
// =============================================================================

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: spring.gentle,
  },
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: spring.gentle,
  },
};

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: spring.gentle,
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 24,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: spring.gentle,
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: spring.snappy,
  },
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: ease.out,
    },
  },
};

// =============================================================================
// CARD & LIST ITEM ANIMATIONS
// =============================================================================

export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.gentle,
  },
  hover: {
    y: -4,
    transition: spring.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -12,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: spring.gentle,
  },
};

// =============================================================================
// MODAL ANIMATIONS
// =============================================================================

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, delay: 0.1 },
  },
};

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 5,
    transition: { duration: 0.15 },
  },
};

// =============================================================================
// BUTTON & INTERACTIVE ANIMATIONS
// =============================================================================

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: spring.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const iconButtonVariants: Variants = {
  idle: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    transition: spring.snappy,
  },
  tap: {
    scale: 0.9,
    transition: { duration: 0.1 },
  },
};

// =============================================================================
// REVEAL ANIMATIONS (scroll-triggered)
// =============================================================================

export const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: ease.out,
    },
  },
};

export const revealFromLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: ease.out,
    },
  },
};

export const revealFromRight: Variants = {
  hidden: {
    opacity: 0,
    x: 60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: ease.out,
    },
  },
};

// =============================================================================
// SPECIAL EFFECTS
// =============================================================================

export const shimmer: Variants = {
  initial: {
    backgroundPosition: "-200% 0",
  },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
    },
  },
};

export const pulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut",
    },
  },
};

export const float: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-4, 4, -4],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "easeInOut",
    },
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create stagger delay for manual use
 */
export function staggerDelay(index: number, baseDelay = 0.05): number {
  return index * baseDelay;
}

/**
 * Create transition with custom duration
 */
export function createTransition(duration: number): Transition {
  return {
    duration,
    ease: ease.out,
  };
}

/**
 * Viewport settings for scroll-triggered animations
 */
export const viewportOnce = {
  once: true,
  margin: "-100px",
};

export const viewportAlways = {
  once: false,
  margin: "-50px",
};
