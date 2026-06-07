type PriceVariant = 'inline' | 'badge' | 'hero';

type PriceProps = {
  priceFrom: number;
  priceTo: number | null;
  variant?: PriceVariant;
  className?: string;
};

export function formatPrice(priceFrom: number, priceTo: number | null) {
  const from = new Intl.NumberFormat('ru-RU').format(priceFrom);
  if (priceTo !== null && priceTo !== priceFrom) {
    return `${from} - ${new Intl.NumberFormat('ru-RU').format(priceTo)} \u20bd`;
  }
  return `\u043e\u0442 ${from} \u20bd`;
}

export function Price({ priceFrom, priceTo, variant = 'inline', className = '' }: PriceProps) {
  const value = formatPrice(priceFrom, priceTo);

  if (variant === 'badge') {
    return (
      <span
        className={[
          'flex min-w-0 max-w-full items-center justify-center rounded-3xl border border-app-line bg-white/82 px-5 py-4 text-center shadow-soft',
          className
        ].join(' ')}
      >
        <span className="max-w-full break-words text-3xl font-extrabold leading-tight text-app-text">{value}</span>
      </span>
    );
  }

  if (variant === 'hero') {
    return (
      <span
        className={[
          'flex min-w-0 max-w-full items-center justify-center rounded-3xl border border-app-line bg-white/82 px-5 py-4 text-center shadow-soft',
          className
        ].join(' ')}
      >
        <span className="max-w-full break-words text-3xl font-extrabold leading-tight text-app-text">{value}</span>
      </span>
    );
  }

  return <span className={className}>{value}</span>;
}
