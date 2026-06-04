import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../components/State';
import { Price } from '../components/Price';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import type { Service } from '../types';

function groupServices(services: Service[]) {
  return services.reduce<Record<string, Service[]>>((acc, service) => {
    acc[service.category] = acc[service.category] || [];
    acc[service.category].push(service);
    return acc;
  }, {});
}

export function HomePage() {
  const { data, loading, error, reload } = useAsyncData(api.getServices, []);

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  const services = data || [];
  const grouped = groupServices(services);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <h1 className="text-2xl font-semibold leading-tight">Выберите учебную работу</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
          Оставьте заявку с комментарием, и администратор напишет вам в Telegram для деталей.
        </p>
      </section>

      {services.length === 0 ? <EmptyState title="Услуги пока не добавлены" /> : null}

      {Object.entries(grouped).map(([category, categoryServices]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-app-muted">{category}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {categoryServices.map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="group rounded-lg border border-app-line bg-app-surface p-4 shadow-soft transition hover:border-app-accent"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-app-line text-app-accent">
                    <FileText size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold leading-tight">{service.title}</h3>
                      <ArrowRight className="shrink-0 text-app-muted transition group-hover:text-app-accent" size={18} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-app-muted">{service.description}</p>
                    <div className="mt-3 text-sm font-semibold text-app-accent">
                      <Price priceFrom={service.price_from} priceTo={service.price_to} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

