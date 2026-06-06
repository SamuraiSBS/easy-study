import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatedButton, AnimatedList, listItemVariants, SuccessBurst } from '../components/Motion';
import { Price } from '../components/Price';
import { ErrorState, LoadingState } from '../components/State';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import { hapticSuccess } from '../services/telegram';

export function OrderFormPage() {
  const navigate = useNavigate();
  const serviceId = Number(useParams().serviceId);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: service, loading, error, reload } = useAsyncData(() => api.getService(serviceId), [serviceId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await api.createOrder(serviceId, comment);
      hapticSuccess();
      setSubmitted(true);
      await new Promise((resolve) => setTimeout(resolve, 720));
      navigate(`/orders/${order.id}`);
    } catch (errorValue) {
      setSubmitError(errorValue instanceof Error ? errorValue.message : 'Не удалось создать заказ');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }
  if (error || !service) {
    return <ErrorState message={error || 'Услуга не найдена'} onRetry={reload} />;
  }

  if (submitted) {
    return <SuccessBurst title="Заявка отправлена" />;
  }

  return (
    <AnimatedList className="space-y-4" as="form" onSubmit={handleSubmit}>
      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <div className="text-sm text-app-muted">Заявка на услугу</div>
        <h1 className="mt-1 text-xl font-semibold">{service.title}</h1>
        <div className="mt-3 text-sm font-semibold text-app-accent">
          <Price priceFrom={service.price_from} priceTo={service.price_to} />
        </div>
      </motion.section>

      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <label className="block text-sm font-semibold" htmlFor="customer-comment">
          Комментарий
        </label>
        <textarea
          id="customer-comment"
          className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-app-line bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-app-accent"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Тема, срок, требования, объем, пожелания"
          maxLength={4000}
        />
        <div className="mt-2 text-right text-xs text-app-muted">{comment.length}/4000</div>
      </motion.section>

      {submitError ? <ErrorState message={submitError} /> : null}

      <AnimatedButton
        type="submit"
        className="app-accent-gradient app-cta-once inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-app-accentText disabled:opacity-60"
        disabled={submitting}
      >
        <Send size={18} /> {submitting ? 'Отправка' : 'Подтвердить заявку'}
      </AnimatedButton>
    </AnimatedList>
  );
}
