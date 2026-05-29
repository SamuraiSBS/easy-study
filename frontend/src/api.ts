import { getInitData } from "./telegram";
import type { Order, OrderPayload, Review, ReviewPayload, Service } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData(),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Не удалось выполнить запрос");
  }

  return response.json() as Promise<T>;
}

export function getServices(): Promise<Service[]> {
  return request<Service[]>("/api/services");
}

export function createOrder(payload: OrderPayload): Promise<Order> {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyOrders(): Promise<Order[]> {
  return request<Order[]>("/api/orders/my");
}

export function getReviews(): Promise<Review[]> {
  return request<Review[]>("/api/reviews");
}

export function createReview(payload: ReviewPayload): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
