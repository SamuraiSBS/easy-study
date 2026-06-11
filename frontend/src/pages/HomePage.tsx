import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenText,
  Clock,
  ClipboardList,
  FileStack,
  FileText,
  GraduationCap,
  Presentation,
  Star,
  User,
  type LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedList, AnimatedSection, listItemVariants, springTransition } from '../components/Motion';
import { EmptyState, ErrorState, ServicesSkeleton } from '../components/State';
import { Price } from '../components/Price';
import { useAsyncData } from '../hooks/useAsyncData';
import { api } from '../services/api';
import type { Service } from '../types';
import { getServiceAccentStyle, getServiceColorByIndex } from '../utils/serviceColors';

const MotionLink = motion(Link);

function groupServices(services: Service[]) {
  return services.reduce<Record<string, Service[]>>((acc, service) => {
    acc[service.category] = acc[service.category] || [];
    acc[service.category].push(service);
    return acc;
  }, {});
}

function getServiceIcon(title: string): LucideIcon {
  const normalizedTitle = title.toLocaleLowerCase('ru-RU');

  if (normalizedTitle.includes('презентац')) {
    return Presentation;
  }
  if (normalizedTitle.includes('доклад')) {
    return FileText;
  }
  if (normalizedTitle.includes('проект')) {
    return ClipboardList;
  }
  if (normalizedTitle.includes('курсов')) {
    return BookOpenText;
  }
  if (normalizedTitle.includes('диплом')) {
    return GraduationCap;
  }
  if (normalizedTitle.includes('реферат')) {
    return FileStack;
  }

  return FileText;
}

function formatServiceRating(reviews: Service['reviews']) {
  const serviceReviews = reviews || [];
  const reviewCount = serviceReviews.length;

  if (reviewCount === 0) {
    return '0';
  }

  const averageRating = serviceReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(averageRating) ? 0 : 1
  }).format(averageRating);
}

function ServiceCard({ service, color }: { service: Service; color: string }) {
  const ServiceIcon = getServiceIcon(service.title);
  const colorStyle = getServiceAccentStyle(color);

  return (
    <MotionLink
      to={`/services/${service.id}`}
      className="app-card app-service-accent-card group flex h-fit self-start rounded-3xl border border-app-line bg-app-surface p-4 pl-5 shadow-soft transition-colors hover:border-[var(--service-color)]"
      style={colorStyle}
      variants={listItemVariants}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
    >
      <div className="flex h-full w-full items-start gap-4">
        <div className="service-icon-surface flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border shadow-soft">
          <ServiceIcon size={38} strokeWidth={2.3} aria-hidden="true" />
        </div>
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug">{service.title}</h3>
            <ArrowRight className="shrink-0 text-[var(--service-color)] transition group-hover:translate-x-1" size={18} />
          </div>
          <p className="mt-2 line-clamp-2 text-base leading-7 text-app-muted">{service.description}</p>
          <div className="mt-2">
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-bold leading-5 text-[var(--service-color)]">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} strokeWidth={2.5} aria-hidden="true" />
                3-7 дней
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User size={15} strokeWidth={2.5} aria-hidden="true" />
                {service.usage_count || 0} заказа
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star size={15} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                {formatServiceRating(service.reviews)} ({service.reviews?.length || 0})
              </span>
            </div>
            <Price
              variant="badge"
              className="service-price-badge w-full"
              color={color}
              priceFrom={service.price_from}
              priceTo={service.price_to}
            />
          </div>
        </div>
      </div>
    </MotionLink>
  );
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
  let cardColorIndex = 0;
  const groupedWithColors = Object.entries(grouped).map(([category, categoryServices]) => ({
    category,
    services: categoryServices.map((service) => {
      const color = getServiceColorByIndex(cardColorIndex);
      cardColorIndex += 1;
      return { service, color };
    })
  }));

  return (
    <div className="space-y-5">
      <AnimatedSection className="app-card app-card-strong rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft">
        <h1 className="text-3xl font-bold leading-tight">Что нужно сделать?</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-app-muted">
          Выберите работу, напишите пару деталей, и мы свяжемся с вами в Telegram.
        </p>
      </AnimatedSection>

      {services.length === 0 ? <EmptyState title="Пока нет доступных услуг" /> : null}

      {groupedWithColors.map(({ category, services: categoryServices }, categoryIndex) => (
        <AnimatedSection key={category} className="space-y-3" delay={categoryIndex * 0.04}>
          <h2 className="text-lg font-bold leading-tight text-app-text">{category}</h2>
          <AnimatedList className="grid gap-3 md:grid-cols-2">
            {categoryServices.map(({ service, color }) => (
              <ServiceCard key={service.id} service={service} color={color} />
            ))}
          </AnimatedList>
        </AnimatedSection>
      ))}
    </div>
  );
}
