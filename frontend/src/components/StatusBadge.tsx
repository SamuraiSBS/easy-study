import type { JSX } from "react";
import type { OrderStatus } from "../types";

const statusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  in_progress: "В работе",
  completed: "Завершен",
  cancelled: "Отменен",
};

export function StatusBadge({ status }: { status: OrderStatus }): JSX.Element {
  return <span className={`status-badge status-${status}`}>{statusLabels[status]}</span>;
}
