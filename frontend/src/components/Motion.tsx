import { MotionConfig, motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type MotionProviderProps = {
  children: ReactNode;
};

type PageTransitionProps = MotionProviderProps & {
  direction?: number;
};

type MotionBlockProps = HTMLMotionProps<'div'> & {
  delay?: number;
};

type AnimatedListProps =
  | (HTMLMotionProps<'div'> & {
      as?: 'div';
    })
  | (HTMLMotionProps<'form'> & {
      as: 'form';
    });

export const springTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.85
} as const;

export const smoothTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1]
} as const;

export const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.04
    }
  }
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition
  }
};

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig transition={springTransition} reducedMotion="user">
      {children}
    </MotionConfig>
  );
}

export function PageTransition({ children, direction = 1 }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * -18, y: -6, scale: 0.99 }}
      transition={prefersReducedMotion ? { duration: 0.12 } : smoothTransition}
    >
      {children}
    </motion.div>
  );
}

export function SuccessBurst({ title }: { title: string }) {
  return (
    <motion.div
      className="app-card app-card-strong flex min-h-52 flex-col items-center justify-center rounded-3xl border border-app-line bg-app-surface p-6 text-center shadow-soft"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springTransition}
    >
      <motion.div
        className="app-accent-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-semibold text-app-accentText"
        initial={{ scale: 0.5, rotate: -14 }}
        animate={{ scale: [0.5, 1.14, 1], rotate: [-14, 5, 0] }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        ✓
      </motion.div>
      <motion.div
        className="mt-4 text-lg font-semibold"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...smoothTransition, delay: 0.14 }}
      >
        {title}
      </motion.div>
    </motion.div>
  );
}

export function AnimatedSection({ children, delay = 0, ...props }: MotionBlockProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {
          opacity: 0,
          y: 18,
          scale: 0.985
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { ...springTransition, delay }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedList({ as = 'div', children, ...props }: AnimatedListProps) {
  if (as === 'form') {
    return (
      <motion.form initial="hidden" animate="visible" variants={listVariants} {...(props as HTMLMotionProps<'form'>)}>
        {children}
      </motion.form>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={listVariants} {...(props as HTMLMotionProps<'div'>)}>
      {children}
    </motion.div>
  );
}

export function AnimatedCard({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={listItemVariants}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedButton({ children, ...props }: HTMLMotionProps<'button'>) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} transition={springTransition} {...props}>
      {children}
    </motion.button>
  );
}
