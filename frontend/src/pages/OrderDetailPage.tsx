import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AttachmentList } from '../components/AttachmentList';
import { AnimatedSection, springTransition } from '../components/Motion';
import { Price } from '../components/Price';
import { ErrorState, LoadingState } from '../components/State';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import { getOrderServiceColor, getServiceAccentStyle } from '../utils/serviceColors';

const MotionLink = motion(Link);

export function OrderDetailPage() {
  const orderId = Number(useParams().orderId);
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [order, services] = await Promise.all([api.getOrder(orderId), api.getServices()]);
      return { order, services };
    },
    [orderId]
  );
  const order = data?.order;

  if (loading) {
    return <LoadingState />;
  }
  if (error || !order) {
    return <ErrorState message={error || 'Не нашли эту заявку'} onRetry={reload} />;
  }

  const review = order.review;
  const serviceColor = getOrderServiceColor(order, data?.services || []);
  const serviceStyle = getServiceAccentStyle(serviceColor);

  return (
    <div className="space-y-4" style={serviceStyle}>
      <MotionLink
        to="/orders"
        className="inline-flex items-center gap-2 text-base font-semibold text-app-muted hover:text-app-text"
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={springTransition}
      >
        <ArrowLeft size={18} /> К заявкам
      </MotionLink>
      <AnimatedSection className="app-card app-service-accent-card rounded-3xl border border-app-line bg-app-surface p-5 pl-6 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base text-app-muted">Заявка #{order.id}</div>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{order.title_snapshot}</h1>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-4">
          <Price variant="badge" color={serviceColor} priceFrom={order.price_from_snapshot} priceTo={order.price_to_snapshot} />
        </div>
        <dl className="mt-5 space-y-4 text-base leading-7">
          <div>
            <dt className="font-bold">Ваш комментарий</dt>
            <dd className="mt-1 whitespace-pre-line text-app-muted">{order.customer_comment || 'Комментария нет'}</dd>
          </div>
          {order.admin_comment ? (
            <div>
              <dt className="font-bold">Комментарий по заявке</dt>
              <dd className="mt-1 whitespace-pre-line text-app-muted">{order.admin_comment}</dd>
            </div>
          ) : null}
          {order.attachments.length ? (
            <div>
              <dt className="font-bold">Файлы</dt>
              <dd className="mt-2">
                <AttachmentList orderId={order.id} attachments={order.attachments} />
              </dd>
            </div>
          ) : null}
        </dl>
        {order.status === 'done' ? (
          review ? (
            <div className="mt-6 rounded-2xl border border-app-line bg-app-bg p-4">
              <div className="flex items-center gap-2 text-base font-bold text-app-text">
                <Star size={18} fill="currentColor" className="text-[var(--service-color)]" />
                Ваш отзыв: {review.rating}/5
              </div>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-app-muted">{review.text}</p>
            </div>
          ) : (
            <MotionLink
              to={`/orders/${order.id}/review`}
              className={`${serviceColor ? 'app-service-gradient' : 'app-accent-gradient'} app-cta-once mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-bold text-app-accentText`}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={springTransition}
            >
              <Star size={18} /> Оставить отзыв
            </MotionLink>
          )
        ) : null}
      </AnimatedSection>
    </div>
  );
}
