import type {
  AdminOrder,
  AdminReview,
  Order,
  OrderAttachment,
  OrderStatus,
  Review,
  Service,
  ServicePayload,
  User
} from '../types';
import { getTelegramInitData } from './telegram';

const configuredApiUrl = window.__EASY_STUDY_CONFIG__?.API_URL || import.meta.env.VITE_API_URL;
const API_URL = configuredApiUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

type RequestConfig = {
  showError?: boolean;
};

function getErrorMessage(detail: unknown) {
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : null))
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

async function request<T>(path: string, options?: RequestInit, config: RequestConfig = {}): Promise<T> {
  const headers = new Headers(options?.headers);
  const initData = getTelegramInitData();

  if (!(options?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (initData) {
    headers.set('Authorization', `Telegram ${initData}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
    const message = getErrorMessage(errorPayload.detail) || 'Ошибка сервера';
    if (config.showError !== false) {
      throw new Error(message);
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function downloadRequest(path: string, filename: string): Promise<void> {
  const headers = new Headers();
  const initData = getTelegramInitData();
  if (initData) {
    headers.set('Authorization', `Telegram ${initData}`);
  }

  const response = await fetch(`${API_URL}${path}`, { headers });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw new Error(getErrorMessage(errorPayload.detail) || 'Ошибка сервера');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export const api = {
  getMe: () => request<User>('/auth/me'),
  getServices: () => request<Service[]>('/services'),
  getService: (serviceId: number) => request<Service>(`/services/${serviceId}`),
  createOrder: (serviceId: number, customerComment: string, attachments: File[] = []) => {
    const formData = new FormData();
    formData.append('service_id', String(serviceId));
    formData.append('customer_comment', customerComment);
    attachments.forEach((attachment) => formData.append('attachments', attachment));
    return request<Order>('/orders', {
      method: 'POST',
      body: formData
    });
  },
  getMyOrders: () => request<Order[]>('/orders/my'),
  getOrder: (orderId: number) => request<Order>(`/orders/${orderId}`),
  downloadOrderAttachment: (orderId: number, attachment: OrderAttachment) =>
    downloadRequest(`/orders/${orderId}/attachments/${attachment.id}`, attachment.original_filename),
  createReview: (orderId: number, rating: number, text: string) =>
    request<Review>(`/orders/${orderId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, text })
    }),
  admin: {
    getOrders: (status?: OrderStatus | 'all') => {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      return request<AdminOrder[]>(`/admin/orders${query}`);
    },
    getOrder: (orderId: number) => request<AdminOrder>(`/admin/orders/${orderId}`),
    updateOrder: (orderId: number, payload: { status?: OrderStatus; admin_comment?: string }) =>
      request<AdminOrder>(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    getServices: () => request<Service[]>('/admin/services'),
    createService: (payload: ServicePayload) =>
      request<Service>('/admin/services', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    updateService: (serviceId: number, payload: Partial<ServicePayload>) =>
      request<Service>(`/admin/services/${serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    deleteService: (serviceId: number) =>
      request<{ ok: boolean }>(`/admin/services/${serviceId}`, {
        method: 'DELETE'
      }),
    getReviews: () => request<AdminReview[]>('/admin/reviews'),
    updateReview: (reviewId: number, isPublished: boolean) =>
      request<AdminReview>(`/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_published: isPublished })
      }),
    getUsers: () => request<User[]>('/admin/users')
  }
};
