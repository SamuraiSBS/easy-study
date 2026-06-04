import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { ErrorState, LoadingState } from '../components/State';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import { hapticSuccess } from '../services/telegram';

export function ReviewPage() {
  const navigate = useNavigate();
  const orderId = Number(useParams().orderId);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: order, loading, error, reload } = useAsyncData(() => api.getOrder(orderId), [orderId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.createReview(orderId, rating, text);
      hapticSuccess();
      navigate('/orders');
    } catch (errorValue) {
      setSubmitError(errorValue instanceof Error ? errorValue.message : 'Не удалось отправить отзыв');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }
  if (error || !order) {
    return <ErrorState message={error || 'Заказ не найден'} onRetry={reload} />;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <div className="text-sm text-app-muted">Отзыв к заказу #{order.id}</div>
        <h1 className="mt-1 text-xl font-semibold">{order.title_snapshot}</h1>
      </section>

      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <div className="text-sm font-semibold">Оценка</div>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`flex h-11 w-11 items-center justify-center rounded-md border ${
                value <= rating ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-app-line text-app-muted'
              }`}
              onClick={() => setRating(value)}
              aria-label={`${value} из 5`}
            >
              <Star size={20} fill={value <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-semibold" htmlFor="review-text">
          Текст отзыва
        </label>
        <textarea
          id="review-text"
          className="mt-3 min-h-36 w-full resize-y rounded-md border border-app-line bg-white px-3 py-3 text-sm outline-none focus:border-app-accent"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Что понравилось, как прошла работа"
          maxLength={3000}
          required
        />
      </section>

      {submitError ? <ErrorState message={submitError} /> : null}

      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-app-accent px-5 py-3 text-sm font-semibold text-app-accentText disabled:opacity-60"
        disabled={submitting}
      >
        <Star size={18} /> {submitting ? 'Отправка' : 'Отправить отзыв'}
      </button>
    </form>
  );
}
