import type { OrderStatus } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  contacted: 'Связались',
  in_progress: 'В работе',
  done: 'Готово',
  cancelled: 'Отменён'
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  new: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  contacted: 'bg-amber-50 text-amber-800 border-amber-200',
  in_progress: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  done: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-800 border-rose-200'
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

