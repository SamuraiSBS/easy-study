import { ArrowRight, MessageSquare, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Price } from '../components/Price';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';

export function OrdersPage() {
  const { data, loading, error, reload } = useAsyncData(api.getMyOrders, []);

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  const orders = data || [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Мои заказы</h1>
      {orders.length === 0 ? <EmptyState title="У вас пока нет заказов" /> : null}
      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block rounded-lg border border-app-line bg-app-surface p-4 shadow-soft transition hover:border-app-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-app-muted">#{order.id}</div>
                <h2 className="mt-1 font-semibold">{order.title_snapshot}</h2>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 text-sm text-app-muted">
              <Price priceFrom={order.price_from_snapshot} priceTo={order.price_to_snapshot} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {order.status === 'done' ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
                  <Star size={15} /> Можно оставить отзыв
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-app-muted">
                  <MessageSquare size={15} /> Админ свяжется в Telegram
                </span>
              )}
              <ArrowRight className="ml-auto text-app-muted" size={18} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

