import { Clock, RussianRuble } from "lucide-react";
import type { JSX } from "react";
import type { Service } from "../types";

type ServiceCardProps = {
  service: Service;
  compact?: boolean;
  selected?: boolean;
  onSelect?: (service: Service) => void;
};

export function ServiceCard({ service, compact = false, selected = false, onSelect }: ServiceCardProps): JSX.Element {
  return (
    <article className={selected ? "service-card selected" : "service-card"}>
      <div>
        <h3>{service.title}</h3>
        {!compact && <p>{service.description}</p>}
      </div>
      <div className="service-meta">
        <span>
          <RussianRuble size={16} aria-hidden="true" />
          от {service.price_from.toLocaleString("ru-RU")} ₽
        </span>
        <span>
          <Clock size={16} aria-hidden="true" />
          {service.estimated_time}
        </span>
      </div>
      {onSelect && (
        <button className="secondary-button" type="button" onClick={() => onSelect(service)}>
          Выбрать
        </button>
      )}
    </article>
  );
}
