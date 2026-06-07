import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedList, AnimatedSection, listItemVariants, springTransition } from '../components/Motion';
import { Price } from '../components/Price';
import { EmptyState, ErrorState, OrdersSkeleton } from '../components/State';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';

const MotionLink = motion(Link);

export function OrdersPage() {
  const { data, loading, error, reload } = useAsyncData(api.getMyOrders, []);

  if (loading) {
    return <OrdersSkeleton />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  const orders = data || [];
  return (
    <div className="space-y-4">
      <AnimatedSection>
        <h1 className="text-3xl font-bold leading-tight">Мои заявки</h1>
      </AnimatedSection>
      {orders.length === 0 ? <EmptyState title="У вас пока нет заявок" /> : null}
      <AnimatedList className="space-y-3">
        {orders.map((order) => (
          <MotionLink
            key={order.id}
            to={`/orders/${order.id}`}
            className="app-card group block rounded-3xl border border-app-line bg-app-surface p-4 shadow-soft transition-colors hover:border-app-accent"
            variants={listItemVariants}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={springTransition}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base text-app-muted">#{order.id}</div>
                <h2 className="mt-1 text-lg font-bold leading-snug">{order.title_snapshot}</h2>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 text-base text-app-muted">
              <Price priceFrom={order.price_from_snapshot} priceTo={order.price_to_snapshot} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-base">
              {order.status === 'done' ? (
                <span className="app-soft-gradient inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-app-accent">
                  <Star size={15} /> Можно оставить отзыв
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-app-muted">
                  <MessageSquare size={15} /> Админ свяжется в Telegram
                </span>
              )}
              <ArrowRight className="ml-auto text-app-muted transition group-hover:translate-x-1 group-hover:text-app-accent" size={18} />
            </div>
          </MotionLink>
        ))}
      </AnimatedList>
    </div>
  );
}
