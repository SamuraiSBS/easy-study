import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedList, AnimatedSection, listItemVariants, springTransition } from '../components/Motion';
import { EmptyState, ErrorState, ServicesSkeleton } from '../components/State';
import { Price } from '../components/Price';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import type { Service } from '../types';

const MotionLink = motion(Link);

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
    return <ServicesSkeleton />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  const services = data || [];
  const grouped = groupServices(services);

  return (
    <div className="space-y-5">
      <AnimatedSection className="app-card app-card-strong rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft">
        <h1 className="text-3xl font-bold leading-tight">Выберите учебную работу</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-app-muted">
          Оставьте заявку с комментарием, и администратор напишет вам в Telegram для деталей.
        </p>
      </AnimatedSection>

      {services.length === 0 ? <EmptyState title="Услуги пока не добавлены" /> : null}

      {Object.entries(grouped).map(([category, categoryServices], categoryIndex) => (
        <AnimatedSection key={category} className="space-y-3" delay={categoryIndex * 0.04}>
          <h2 className="text-lg font-bold leading-tight text-app-text">{category}</h2>
          <AnimatedList className="grid gap-3 md:grid-cols-2">
            {categoryServices.map((service) => (
              <MotionLink
                key={service.id}
                to={`/services/${service.id}`}
                className="app-card group rounded-3xl border border-app-line bg-app-surface p-4 shadow-soft transition-colors hover:border-app-accent"
                variants={listItemVariants}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={springTransition}
              >
                <div className="flex items-start gap-3">
                  <motion.span
                    className="app-soft-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-app-accent"
                    whileHover={{ rotate: -3, scale: 1.06 }}
                    transition={springTransition}
                  >
                    <FileText size={20} />
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold leading-snug">{service.title}</h3>
                      <ArrowRight className="shrink-0 text-app-muted transition group-hover:translate-x-1 group-hover:text-app-accent" size={18} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-base leading-7 text-app-muted">{service.description}</p>
                    <div className="mt-3 text-base font-bold text-app-accent">
                      <Price priceFrom={service.price_from} priceTo={service.price_to} />
                    </div>
                  </div>
                </div>
              </MotionLink>
            ))}
          </AnimatedList>
        </AnimatedSection>
      ))}
    </div>
  );
}
