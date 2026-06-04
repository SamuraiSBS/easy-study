import { ArrowLeft, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Price } from '../components/Price';
import { ErrorState, LoadingState } from '../components/State';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';

export function OrderDetailPage() {
  const orderId = Number(useParams().orderId);
  const { data: order, loading, error, reload } = useAsyncData(() => api.getOrder(orderId), [orderId]);

  if (loading) {
    return <LoadingState />;
  }
  if (error || !order) {
    return <ErrorState message={error || 'Заказ не найден'} onRetry={reload} />;
  }

  return (
    <div className="space-y-4">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-app-muted hover:text-app-text">
        <ArrowLeft size={18} /> К заказам
      </Link>
      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-app-muted">Заказ #{order.id}</div>
            <h1 className="mt-1 text-xl font-semibold">{order.title_snapshot}</h1>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-4 text-sm font-semibold text-app-accent">
          <Price priceFrom={order.price_from_snapshot} priceTo={order.price_to_snapshot} />
        </div>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="font-semibold">Комментарий</dt>
            <dd className="mt-1 whitespace-pre-line text-app-muted">{order.customer_comment || 'Без комментария'}</dd>
          </div>
          {order.admin_comment ? (
            <div>
              <dt className="font-semibold">Комментарий администратора</dt>
              <dd className="mt-1 whitespace-pre-line text-app-muted">{order.admin_comment}</dd>
            </div>
          ) : null}
        </dl>
        {order.status === 'done' ? (
          <Link
            to={`/orders/${order.id}/review`}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-app-accent px-5 py-2 text-sm font-semibold text-app-accentText"
          >
            <Star size={18} /> Оставить отзыв
          </Link>
        ) : null}
      </section>
    </div>
  );
}

