import { Send } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: service, loading, error, reload } = useAsyncData(() => api.getService(serviceId), [serviceId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await api.createOrder(serviceId, comment);
      hapticSuccess();
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <div className="text-sm text-app-muted">Заявка на услугу</div>
        <h1 className="mt-1 text-xl font-semibold">{service.title}</h1>
        <div className="mt-3 text-sm font-semibold text-app-accent">
          <Price priceFrom={service.price_from} priceTo={service.price_to} />
        </div>
      </section>

      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <label className="block text-sm font-semibold" htmlFor="customer-comment">
          Комментарий
        </label>
        <textarea
          id="customer-comment"
          className="mt-3 min-h-40 w-full resize-y rounded-md border border-app-line bg-white px-3 py-3 text-sm outline-none focus:border-app-accent"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Тема, срок, требования, объём, пожелания"
          maxLength={4000}
        />
        <div className="mt-2 text-right text-xs text-app-muted">{comment.length}/4000</div>
      </section>

      {submitError ? <ErrorState message={submitError} /> : null}

      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-app-accent px-5 py-3 text-sm font-semibold text-app-accentText disabled:opacity-60"
        disabled={submitting}
      >
        <Send size={18} /> {submitting ? 'Отправка' : 'Подтвердить заявку'}
      </button>
    </form>
  );
}
