import { motion } from 'framer-motion';
import type { OrderStatus } from '../types';
import { springTransition } from './Motion';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  contacted: 'Связались',
  in_progress: 'В работе',
  done: 'Готово',
  cancelled: 'Отменен'
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  new: 'bg-[#ecfff5] text-[#0f8f4d] border-[#b8f0d0]',
  contacted: 'bg-[#d8fbe8] text-[#0c7f45] border-[#91e7b8]',
  in_progress: 'bg-[#c2f6d9] text-[#096b3a] border-[#69de9f]',
  done: 'bg-[#2ed67d] text-white border-[#2ed67d]',
  cancelled: 'bg-[#f0fbf5] text-[#4d735f] border-[#cdeedc]'
};

function statusAnimation(status: OrderStatus) {
  if (status === 'new') {
    return {
      opacity: 1,
      y: 0,
      scale: [1, 1.08, 1]
    };
  }
  if (status === 'done') {
    return {
      opacity: 1,
      y: 0,
      scale: [1, 1.1, 1],
      boxShadow: ['0 0 0 rgba(46, 214, 125, 0)', '0 0 0 5px rgba(46, 214, 125, 0.18)', '0 0 0 rgba(46, 214, 125, 0)']
    };
  }
  if (status === 'cancelled') {
    return {
      opacity: 0.82,
      y: 0,
      scale: 1
    };
  }
  return {
    opacity: 1,
    y: 0,
    scale: 1
  };
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <motion.span
      key={status}
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}
      initial={{ opacity: 0, y: -4, scale: 0.92 }}
      animate={statusAnimation(status)}
      transition={{ ...springTransition, duration: 0.42 }}
    >
      {ORDER_STATUS_LABELS[status]}
    </motion.span>
  );
}
