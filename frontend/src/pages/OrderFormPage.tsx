import { motion } from 'framer-motion';
import { Paperclip, Send, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatedButton, AnimatedList, listItemVariants, SuccessBurst } from '../components/Motion';
import { Price } from '../components/Price';
import { ErrorState, LoadingState } from '../components/State';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import { hapticSuccess } from '../services/telegram';
import { getServiceColor } from '../utils/serviceColors';

const MAX_ATTACHMENTS = 5;

export function OrderFormPage() {
  const navigate = useNavigate();
  const serviceId = Number(useParams().serviceId);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [service, services] = await Promise.all([api.getService(serviceId), api.getServices()]);
      return { service, services };
    },
    [serviceId]
  );
  const service = data?.service;

  function addAttachments(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    const nextAttachments = [...attachments, ...Array.from(files)];
    if (nextAttachments.length > MAX_ATTACHMENTS) {
      setFileError(`Можно прикрепить не больше ${MAX_ATTACHMENTS} файлов`);
      setAttachments(nextAttachments.slice(0, MAX_ATTACHMENTS));
      return;
    }
    setFileError(null);
    setAttachments(nextAttachments);
  }

  function removeAttachment(index: number) {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setFileError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await api.createOrder(serviceId, comment, attachments);
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

  const serviceColor = getServiceColor(service.id, data?.services || []);

  return (
    <AnimatedList className="space-y-4" as="form" onSubmit={handleSubmit}>
      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <div className="text-base text-app-muted">Заявка на услугу</div>
        <h1 className="mt-1 text-xl font-bold leading-tight">{service.title}</h1>
        <div className="mt-4">
          <Price variant="badge" color={serviceColor} priceFrom={service.price_from} priceTo={service.price_to} />
        </div>
      </motion.section>

      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <label className="block text-base font-bold" htmlFor="customer-comment">
          Комментарий
        </label>
        <textarea
          id="customer-comment"
          className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-app-line bg-white px-4 py-3 text-base leading-7 outline-none transition-colors focus:border-app-accent"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Тема, срок, требования, объем, пожелания"
          maxLength={4000}
        />
        <div className="mt-2 text-right text-sm text-app-muted">{comment.length}/4000</div>
      </motion.section>

      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <div className="flex items-center justify-between gap-3">
          <label className="block text-base font-bold" htmlFor="order-attachments">
            Фото или файлы
          </label>
          <span className="text-sm text-app-muted">{attachments.length}/{MAX_ATTACHMENTS}</span>
        </div>
        <label
          className="mt-3 flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-app-line bg-white px-4 py-3 text-base font-semibold text-app-muted transition-colors hover:border-app-accent hover:text-app-text"
          htmlFor="order-attachments"
        >
          <Paperclip size={18} /> Прикрепить
        </label>
        <input
          id="order-attachments"
          className="sr-only"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
          onChange={(event) => {
            addAttachments(event.target.files);
            event.target.value = '';
          }}
          disabled={attachments.length >= MAX_ATTACHMENTS}
        />
        {attachments.length ? (
          <div className="mt-3 space-y-2">
            {attachments.map((attachment, index) => (
              <div key={`${attachment.name}-${attachment.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-app-line bg-white px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{attachment.name}</div>
                  <div className="text-xs text-app-muted">{(attachment.size / 1024 / 1024).toFixed(1)} МБ</div>
                </div>
                <AnimatedButton
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-app-line text-app-muted"
                  onClick={() => removeAttachment(index)}
                  title="Убрать файл"
                >
                  <X size={15} />
                </AnimatedButton>
              </div>
            ))}
          </div>
        ) : null}
        {fileError ? <div className="mt-2 text-sm font-medium text-red-600">{fileError}</div> : null}
      </motion.section>

      {submitError ? <ErrorState message={submitError} /> : null}

      <AnimatedButton
        type="submit"
        className="app-accent-gradient app-cta-once inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-bold text-app-accentText disabled:opacity-60"
        disabled={submitting}
      >
        <Send size={18} /> {submitting ? 'Отправка' : 'Подтвердить заявку'}
      </AnimatedButton>
    </AnimatedList>
  );
}
