import { Check, Filter, Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Price } from '../components/Price';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { ORDER_STATUS_LABELS, StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import type { AdminOrder, OrderStatus, Service, ServicePayload, User } from '../types';

type Tab = 'orders' | 'services' | 'reviews' | 'users';

const emptyServiceForm: ServicePayload = {
  title: '',
  description: '',
  price_from: 0,
  price_to: null,
  category: 'Школьные и студенческие работы',
  is_active: true,
  order_num: 100
};

function AdminTabs({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'orders', label: 'Заказы' },
    { id: 'services', label: 'Услуги' },
    { id: 'reviews', label: 'Отзывы' },
    { id: 'users', label: 'Пользователи' }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((item) => (
        <button
          key={item.id}
          className={`min-h-10 rounded-md px-4 text-sm font-medium ${
            tab === item.id ? 'bg-app-accent text-app-accentText' : 'bg-app-surface text-app-muted'
          }`}
          onClick={() => setTab(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function OrdersAdmin({ initialOrderId }: { initialOrderId?: number }) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(initialOrderId || null);
  const [adminComment, setAdminComment] = useState('');
  const [nextStatus, setNextStatus] = useState<OrderStatus>('new');
  const { data: orders, loading, error, reload } = useAsyncData(() => api.admin.getOrders(statusFilter), [statusFilter]);

  const selected = useMemo(
    () => orders?.find((order) => order.id === selectedId) || orders?.[0] || null,
    [orders, selectedId]
  );

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setAdminComment(selected.admin_comment || '');
      setNextStatus(selected.status);
    }
  }, [selected?.id]);

  async function saveOrder() {
    if (!selected) {
      return;
    }
    await api.admin.updateOrder(selected.id, { status: nextStatus, admin_comment: adminComment });
    await reload();
  }

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-app-muted" />
          <select
            className="rounded-md border border-app-line bg-app-surface px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'all')}
          >
            <option value="all">Все статусы</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {orders?.length === 0 ? <EmptyState title="Заказов нет" /> : null}
        {orders?.map((order) => (
          <button
            key={order.id}
            className={`block w-full rounded-lg border p-4 text-left shadow-soft ${
              selected?.id === order.id ? 'border-app-accent bg-app-surface' : 'border-app-line bg-app-surface'
            }`}
            onClick={() => setSelectedId(order.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-app-muted">#{order.id}</div>
                <div className="mt-1 font-semibold">{order.title_snapshot}</div>
                <div className="mt-1 text-sm text-app-muted">{order.user.first_name || order.user.username || order.user.telegram_id}</div>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </button>
        ))}
      </section>

      <aside className="rounded-lg border border-app-line bg-app-surface p-4 shadow-soft">
        {selected ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-app-muted">Заказ #{selected.id}</div>
              <h2 className="mt-1 text-lg font-semibold">{selected.title_snapshot}</h2>
              <div className="mt-2 text-sm font-semibold text-app-accent">
                <Price priceFrom={selected.price_from_snapshot} priceTo={selected.price_to_snapshot} />
              </div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">Клиент</div>
              <div className="mt-1 text-app-muted">
                {selected.user.first_name || 'Без имени'} {selected.user.username ? `@${selected.user.username}` : ''}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">Комментарий клиента</div>
              <div className="mt-1 whitespace-pre-line text-app-muted">{selected.customer_comment || 'Без комментария'}</div>
            </div>
            <label className="block text-sm font-semibold">
              Статус
              <select
                className="mt-2 w-full rounded-md border border-app-line bg-white px-3 py-2"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Комментарий администратора
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-md border border-app-line bg-white px-3 py-2"
                value={adminComment}
                onChange={(event) => setAdminComment(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-app-accent px-4 py-2 text-sm font-semibold text-app-accentText"
              onClick={() => void saveOrder()}
            >
              <Save size={17} /> Сохранить
            </button>
          </div>
        ) : (
          <EmptyState title="Выберите заказ" />
        )}
      </aside>
    </div>
  );
}

function ServiceForm({ service, onSaved }: { service?: Service; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<ServicePayload>(service ? toServicePayload(service) : emptyServiceForm);

  useEffect(() => {
    setForm(service ? toServicePayload(service) : emptyServiceForm);
  }, [service?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (service) {
      await api.admin.updateService(service.id, form);
    } else {
      await api.admin.createService(form);
    }
    setForm(emptyServiceForm);
    await onSaved();
  }

  return (
    <form className="rounded-lg border border-app-line bg-app-surface p-4 shadow-soft" onSubmit={submit}>
      <h2 className="font-semibold">{service ? 'Редактировать услугу' : 'Новая услуга'}</h2>
      <div className="mt-4 grid gap-3">
        <input
          className="rounded-md border border-app-line px-3 py-2 text-sm"
          placeholder="Название"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
        <textarea
          className="min-h-24 rounded-md border border-app-line px-3 py-2 text-sm"
          placeholder="Описание"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          required
        />
        <input
          className="rounded-md border border-app-line px-3 py-2 text-sm"
          placeholder="Категория"
          value={form.category}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-md border border-app-line px-3 py-2 text-sm"
            type="number"
            min={0}
            value={form.price_from}
            onChange={(event) => setForm({ ...form, price_from: Number(event.target.value) })}
          />
          <input
            className="rounded-md border border-app-line px-3 py-2 text-sm"
            type="number"
            min={0}
            value={form.price_to ?? ''}
            onChange={(event) => setForm({ ...form, price_to: event.target.value ? Number(event.target.value) : null })}
            placeholder="Цена до"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            Активна
          </label>
          <input
            className="w-24 rounded-md border border-app-line px-3 py-2 text-sm"
            type="number"
            value={form.order_num}
            onChange={(event) => setForm({ ...form, order_num: Number(event.target.value) })}
          />
        </div>
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-app-accent px-4 py-2 text-sm font-semibold text-app-accentText">
          {service ? <Save size={17} /> : <Plus size={17} />} {service ? 'Сохранить услугу' : 'Добавить услугу'}
        </button>
      </div>
    </form>
  );
}

function toServicePayload(service: Service): ServicePayload {
  return {
    title: service.title,
    description: service.description,
    price_from: service.price_from,
    price_to: service.price_to,
    category: service.category,
    is_active: service.is_active,
    order_num: service.order_num
  };
}

function ServicesAdmin() {
  const { data: services, loading, error, reload } = useAsyncData(api.admin.getServices, []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingService = services?.find((service) => service.id === editingId);

  async function deleteService(serviceId: number) {
    await api.admin.deleteService(serviceId);
    await reload();
  }

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-3">
        {services?.map((service) => (
          <div key={service.id} className="rounded-lg border border-app-line bg-app-surface p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{service.title}</h3>
                <div className="mt-1 text-sm text-app-muted">{service.category}</div>
                <div className="mt-2 text-sm font-semibold text-app-accent">
                  <Price priceFrom={service.price_from} priceTo={service.price_to} />
                </div>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs ${service.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {service.is_active ? 'активна' : 'скрыта'}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
            <button type="button" className="rounded-md border border-app-line px-3 py-2 text-sm" onClick={() => setEditingId(service.id)}>
              Изменить
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm text-rose-700"
              onClick={() => void deleteService(service.id)}
            >
                <Trash2 size={16} /> Скрыть
              </button>
            </div>
          </div>
        ))}
      </section>
      <ServiceForm service={editingService} onSaved={reload} />
    </div>
  );
}

function ReviewsAdmin() {
  const { data: reviews, loading, error, reload } = useAsyncData(api.admin.getReviews, []);

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-3">
      {reviews?.length === 0 ? <EmptyState title="Отзывов пока нет" /> : null}
      {reviews?.map((review) => (
        <div key={review.id} className="rounded-lg border border-app-line bg-app-surface p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{review.rating}/5</div>
              <div className="mt-1 text-sm text-app-muted">{review.user.first_name || review.user.username || review.user.telegram_id}</div>
            </div>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                review.is_published ? 'bg-emerald-50 text-emerald-800' : 'bg-app-line text-app-muted'
              }`}
              onClick={() => void api.admin.updateReview(review.id, !review.is_published).then(reload)}
            >
              <Check size={16} /> {review.is_published ? 'Опубликован' : 'Скрыт'}
            </button>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-app-muted">{review.text}</p>
        </div>
      ))}
    </div>
  );
}

function UsersAdmin() {
  const { data: users, loading, error, reload } = useAsyncData(api.admin.getUsers, []);

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-3">
      {users?.map((user: User) => (
        <div key={user.id} className="rounded-lg border border-app-line bg-app-surface p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{user.first_name || user.username || `ID ${user.telegram_id}`}</div>
              <div className="mt-1 text-sm text-app-muted">
                {user.username ? `@${user.username}` : 'без username'} · {user.telegram_id}
              </div>
            </div>
            {user.is_admin ? <span className="rounded-md bg-app-line px-2 py-1 text-xs text-app-accent">admin</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPage() {
  const params = useParams();
  const orderId = params.orderId ? Number(params.orderId) : undefined;
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Админка</h1>
        {orderId ? (
          <Link className="rounded-md border border-app-line px-3 py-2 text-sm" to="/admin">
            Все заказы
          </Link>
        ) : null}
      </div>
      <AdminTabs tab={tab} setTab={setTab} />
      {tab === 'orders' ? <OrdersAdmin initialOrderId={orderId} /> : null}
      {tab === 'services' ? <ServicesAdmin /> : null}
      {tab === 'reviews' ? <ReviewsAdmin /> : null}
      {tab === 'users' ? <UsersAdmin /> : null}
    </div>
  );
}
