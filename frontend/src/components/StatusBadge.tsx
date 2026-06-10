import { motion } from 'framer-motion';
import type { OrderStatus } from '../types';
import { springTransition } from './Motion';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  contacted: 'Связались',
  in_progress: 'В работе',
  done: 'Готово',
  cancelled: 'Отменено'
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  new: 'bg-[#7B3DFF18] text-[#6530d6] border-[#7B3DFF55]',
  contacted: 'bg-[#2ED67D18] text-[#1aa060] border-[#2ED67D55]',
  in_progress: 'bg-[#FF8A0018] text-[#b95f00] border-[#FF8A0055]',
  done: 'bg-[#2ED67D] text-white border-[#2ED67D]',
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
      boxShadow: ['0 0 0 rgba(46, 214, 125, 0)', '0 0 0 5px rgba(46, 214, 125, 0.22)', '0 0 0 rgba(46, 214, 125, 0)']
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
