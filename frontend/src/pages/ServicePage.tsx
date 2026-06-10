import { motion } from 'framer-motion';
import { ArrowLeft, Send, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AnimatedSection, springTransition } from '../components/Motion';
import { Price } from '../components/Price';
import { ErrorState, LoadingState } from '../components/State';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import { getServiceAccentStyle, getServiceColor } from '../utils/serviceColors';

const MotionLink = motion(Link);

export function ServicePage() {
  const params = useParams();
  const serviceId = Number(params.serviceId);
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [service, services] = await Promise.all([api.getService(serviceId), api.getServices()]);
      return { service, services };
    },
    [serviceId]
  );
  const service = data?.service;

  if (loading) {
    return <LoadingState />;
  }
  if (error || !service) {
    return <ErrorState message={error || 'Не нашли эту услугу'} onRetry={reload} />;
  }

  const reviews = service.reviews || [];
  const serviceColor = getServiceColor(service.id, data?.services || []);
  const serviceStyle = getServiceAccentStyle(serviceColor);

  return (
    <div className="space-y-4" style={serviceStyle}>
      <MotionLink
        to="/"
        className="inline-flex items-center gap-2 text-base font-semibold text-app-muted hover:text-app-text"
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={springTransition}
      >
        <ArrowLeft size={18} /> К услугам
      </MotionLink>
      <AnimatedSection className="app-card app-card-strong app-service-accent-card rounded-3xl border border-app-line bg-app-surface p-5 pl-6 shadow-soft">
        <div className="text-base font-semibold text-[var(--service-color)]">{service.category}</div>
        <h1 className="mt-2 text-3xl font-bold leading-tight">{service.title}</h1>
        <p className="mt-4 whitespace-pre-line text-base leading-7 text-app-muted">{service.description}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <Price variant="hero" color={serviceColor} priceFrom={service.price_from} priceTo={service.price_to} />
          <MotionLink
            to={`/services/${service.id}/order`}
            className={`${serviceColor ? 'app-service-gradient' : 'app-accent-gradient'} app-cta-once inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-bold text-app-accentText sm:w-auto`}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={springTransition}
          >
            <Send size={18} /> Оставить заявку
          </MotionLink>
        </div>
      </AnimatedSection>
      <AnimatedSection className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" delay={0.04}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold leading-tight">Отзывы</h2>
          {reviews.length > 0 ? (
            <span className="rounded-full bg-app-line px-3 py-1 text-sm font-semibold text-app-muted">
              {reviews.length}
            </span>
          ) : null}
        </div>
        {reviews.length === 0 ? (
          <p className="mt-3 text-base leading-7 text-app-muted">По этой услуге пока нет отзывов.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-app-line bg-app-bg/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{review.user_name}</div>
                    <div className="mt-1 flex items-center gap-1 text-app-accent" aria-label={`Оценка ${review.rating} из 5`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={16}
                          fill={index < review.rating ? 'currentColor' : 'none'}
                          className={index < review.rating ? 'text-app-accent' : 'text-app-muted'}
                        />
                      ))}
                    </div>
                  </div>
                  <time className="shrink-0 text-sm text-app-muted" dateTime={review.created_at}>
                    {new Date(review.created_at).toLocaleDateString('ru-RU')}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-line text-base leading-7 text-app-muted">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </AnimatedSection>
    </div>
  );
}
