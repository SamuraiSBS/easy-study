import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AnimatedButton, AnimatedList, listItemVariants, springTransition } from './Motion';

export function LoadingState() {
  return (
    <motion.div
      className="flex min-h-40 items-center justify-center text-app-muted"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
    >
      <div className="app-loading-shimmer flex min-h-14 items-center justify-center rounded-full px-5">
        <Loader2 className="mr-2 animate-spin" size={20} />
        Загрузка
      </div>
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      className="app-card rounded-3xl border border-app-line bg-app-surface p-5 text-base leading-7 shadow-soft"
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springTransition}
    >
      <div className="flex items-start gap-3 text-app-danger">
        <AlertCircle size={20} />
        <div className="min-w-0 flex-1">{message}</div>
      </div>
      {onRetry ? (
        <AnimatedButton type="button" className="app-accent-gradient mt-4 rounded-full px-5 py-3 text-base font-bold text-app-accentText" onClick={onRetry}>
          Повторить
        </AnimatedButton>
      ) : null}
    </motion.div>
  );
}

export function EmptyState({ title }: { title: string }) {
  return (
    <motion.div
      className="app-card rounded-3xl border border-dashed border-app-line bg-app-surface p-6 text-center text-base leading-7 text-app-muted"
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={springTransition}
    >
      {title}
    </motion.div>
  );
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`app-skeleton-line ${className}`} />;
}

export function ServicesSkeleton() {
  return (
    <AnimatedList className="space-y-5">
      <motion.section className="app-card app-card-strong rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <SkeletonLine className="h-8 w-4/5" />
        <SkeletonLine className="mt-4 h-5 w-full" />
        <SkeletonLine className="mt-2 h-5 w-2/3" />
      </motion.section>
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <motion.div key={item} className="app-card rounded-3xl border border-app-line bg-app-surface p-4 shadow-soft" variants={listItemVariants}>
            <div className="flex items-start gap-3">
              <div className="app-skeleton-line h-10 w-10 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <SkeletonLine className="h-6 w-3/4" />
                <SkeletonLine className="mt-3 h-5 w-full" />
                <SkeletonLine className="mt-2 h-5 w-2/3" />
                <SkeletonLine className="mt-4 h-5 w-24" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatedList>
  );
}

export function OrdersSkeleton() {
  return (
    <AnimatedList className="space-y-3">
      {[1, 2, 3].map((item) => (
        <motion.div key={item} className="app-card rounded-3xl border border-app-line bg-app-surface p-4 shadow-soft" variants={listItemVariants}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SkeletonLine className="h-5 w-14" />
              <SkeletonLine className="mt-3 h-6 w-4/5" />
            </div>
            <SkeletonLine className="h-7 w-20" />
          </div>
          <SkeletonLine className="mt-4 h-5 w-28" />
          <SkeletonLine className="mt-5 h-5 w-3/5" />
        </motion.div>
      ))}
    </AnimatedList>
  );
}
