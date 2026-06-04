export function formatPrice(priceFrom: number, priceTo: number | null) {
  const from = new Intl.NumberFormat('ru-RU').format(priceFrom);
  if (priceTo !== null && priceTo !== priceFrom) {
    return `${from} - ${new Intl.NumberFormat('ru-RU').format(priceTo)} ₽`;
  }
  return `от ${from} ₽`;
}

export function Price({ priceFrom, priceTo }: { priceFrom: number; priceTo: number | null }) {
  return <span>{formatPrice(priceFrom, priceTo)}</span>;
}

