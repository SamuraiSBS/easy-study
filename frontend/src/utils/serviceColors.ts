import type { Order, Service } from '../types';

export const SERVICE_CARD_COLORS = ['#2ED67D', '#FF8A00', '#7B3DFF'] as const;

export function getServiceColorByIndex(index: number) {
  return SERVICE_CARD_COLORS[index % SERVICE_CARD_COLORS.length];
}

export function getServiceColor(serviceId: number | null, services: Service[]) {
  if (serviceId === null) {
    return undefined;
  }

  const serviceIndex = services.findIndex((service) => service.id === serviceId);
  if (serviceIndex === -1) {
    return undefined;
  }

  return getServiceColorByIndex(serviceIndex);
}

export function getOrderServiceColor(order: Order, services: Service[]) {
  const colorById = getServiceColor(order.service_id, services);
  if (colorById) {
    return colorById;
  }

  const serviceIndex = services.findIndex(
    (service) => service.title === order.title_snapshot && service.category === order.category_snapshot
  );

  return serviceIndex === -1 ? undefined : getServiceColorByIndex(serviceIndex);
}
