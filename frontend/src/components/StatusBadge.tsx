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
  new: 'bg-[#e9fbf1] text-[#1aa060] border-[#a7e3bf]',
  contacted: 'bg-[#d7f5e4] text-[#188f57] border-[#8ad8ad]',
  in_progress: 'bg-[#c3efd5] text-[#12844f] border-[#63c991]',
  done: 'bg-[#24b26d] text-white border-[#24b26d]',
  cancelled: 'bg-[#eef8f2] text-[#35664d] border-[#c4e7d2]'
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
      boxShadow: ['0 0 0 rgba(36, 178, 105, 0)', '0 0 0 5px rgba(36, 178, 105, 0.2)', '0 0 0 rgba(36, 178, 105, 0)']
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
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[13px] font-semibold ${STATUS_CLASS[status]}`}
      initial={{ opacity: 0, y: -4, scale: 0.92 }}
      animate={statusAnimation(status)}
      transition={{ ...springTransition, duration: 0.42 }}
    >
      {ORDER_STATUS_LABELS[status]}
    </motion.span>
  );
}
