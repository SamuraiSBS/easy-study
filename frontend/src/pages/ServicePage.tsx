import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AnimatedSection, springTransition } from '../components/Motion';
import { Price } from '../components/Price';
import { ErrorState, LoadingState } from '../components/State';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';

const MotionLink = motion(Link);

export function ServicePage() {
  const params = useParams();
  const serviceId = Number(params.serviceId);
  const { data: service, loading, error, reload } = useAsyncData(() => api.getService(serviceId), [serviceId]);

  if (loading) {
    return <LoadingState />;
  }
  if (error || !service) {
    return <ErrorState message={error || 'Услуга не найдена'} onRetry={reload} />;
  }

  return (
    <div className="space-y-4">
      <MotionLink
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-app-muted hover:text-app-text"
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={springTransition}
      >
        <ArrowLeft size={18} /> Назад
      </MotionLink>
      <AnimatedSection className="app-card app-card-strong rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft">
        <div className="text-sm font-medium text-app-accent">{service.category}</div>
        <h1 className="mt-2 text-2xl font-semibold leading-tight">{service.title}</h1>
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-app-muted">{service.description}</p>
        <div className="mt-5 text-lg font-semibold">
          <Price priceFrom={service.price_from} priceTo={service.price_to} />
        </div>
        <MotionLink
          to={`/services/${service.id}/order`}
          className="app-accent-gradient app-cta-once mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-app-accentText"
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={springTransition}
        >
          <Send size={18} /> Оформить заявку
        </MotionLink>
      </AnimatedSection>
    </div>
  );
}
