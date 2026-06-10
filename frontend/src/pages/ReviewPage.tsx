import { motion } from 'framer-motion';
import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { AnimatedButton, AnimatedList, listItemVariants, springTransition, SuccessBurst } from '../components/Motion';
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
  const [submitted, setSubmitted] = useState(false);
  const [duplicateReview, setDuplicateReview] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: order, loading, error, reload } = useAsyncData(() => api.getOrder(orderId), [orderId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setDuplicateReview(false);
    setSubmitError(null);
    try {
      await api.createReview(orderId, rating, text);
      hapticSuccess();
      setSubmitted(true);
      await new Promise((resolve) => setTimeout(resolve, 720));
      navigate('/orders');
    } catch (errorValue) {
      const message = errorValue instanceof Error ? errorValue.message : 'Не получилось отправить отзыв';
      if (message === 'Review already exists') {
        setDuplicateReview(true);
        await reload();
        return;
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }
  if (error || !order) {
    return <ErrorState message={error || 'Не нашли эту заявку'} onRetry={reload} />;
  }

  if (submitted) {
    return <SuccessBurst title="Спасибо за отзыв" />;
  }

  if (order.review || duplicateReview) {
    return (
      <AnimatedList className="space-y-4">
        <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
          <div className="text-base text-app-muted">Отзыв к заявке #{order.id}</div>
          <h1 className="mt-1 text-xl font-bold leading-tight">{order.title_snapshot}</h1>
          <div className="mt-5 rounded-2xl border border-app-line bg-app-bg p-4">
            {order.review ? (
              <>
                <div className="flex items-center gap-2 text-base font-bold text-app-text">
                  <Star size={18} fill="currentColor" className="text-app-accent" />
                  Ваш отзыв: {order.review.rating}/5
                </div>
                <p className="mt-3 whitespace-pre-line text-base leading-7 text-app-muted">{order.review.text}</p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-base font-bold text-app-text">
                <Star size={18} fill="currentColor" className="text-app-accent" />
                Отзыв уже есть
              </div>
            )}
          </div>
        </motion.section>
      </AnimatedList>
    );
  }

  return (
    <AnimatedList className="space-y-4" as="form" onSubmit={handleSubmit}>
      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <div className="text-base text-app-muted">Отзыв к заявке #{order.id}</div>
        <h1 className="mt-1 text-xl font-bold leading-tight">{order.title_snapshot}</h1>
      </motion.section>

      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <div className="text-base font-bold">Оценка</div>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <motion.button
              key={value}
              type="button"
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                value <= rating ? 'app-soft-gradient border-app-accent text-app-accent' : 'border-app-line text-app-muted'
              }`}
              onClick={() => setRating(value)}
              aria-label={`${value} из 5`}
              whileHover={{ y: -2, scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              animate={value <= rating ? { scale: [1, 1.16, 1], rotate: [0, -4, 0] } : { scale: 1, rotate: 0 }}
              transition={{ ...springTransition, duration: 0.28 }}
            >
              <Star size={20} fill={value <= rating ? 'currentColor' : 'none'} />
            </motion.button>
          ))}
        </div>
        <label className="mt-5 block text-base font-bold" htmlFor="review-text">
          Пару слов о работе
        </label>
        <textarea
          id="review-text"
          className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-app-line bg-white px-4 py-3 text-base leading-7 outline-none transition-colors focus:border-app-accent"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Что понравилось или что можно было сделать лучше"
          maxLength={3000}
          required
        />
      </motion.section>

      {submitError ? <ErrorState message={submitError} /> : null}

      <AnimatedButton
        type="submit"
        className="app-accent-gradient app-cta-once inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-bold text-app-accentText disabled:opacity-60"
        disabled={submitting}
      >
        <Star size={18} /> {submitting ? 'Отправляем' : 'Отправить отзыв'}
      </AnimatedButton>
    </AnimatedList>
  );
}
