type CommonTranslator = (key: string) => string;

const BOOKING_STATUS_CONFIG: Record<
  string,
  { className: string; labelKey?: 'status.confirmed' | 'status.pending' | 'status.cancelled' }
> = {
  CONFIRMED: {
    className: 'bg-emerald-100 text-emerald-700',
    labelKey: 'status.confirmed',
  },
  PENDING: {
    className: 'bg-amber-100 text-amber-700',
    labelKey: 'status.pending',
  },
  CANCELLED: {
    className: 'bg-slate-100 text-slate-600',
    labelKey: 'status.cancelled',
  },
};

export function BookingStatusBadge({
  status,
  translate,
}: {
  status: string;
  translate: CommonTranslator;
}) {
  const config = BOOKING_STATUS_CONFIG[status] ?? {
    className: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`rounded px-3 py-1 text-xs font-bold ${config.className}`}>
      {config.labelKey ? translate(config.labelKey).toUpperCase() : status.toUpperCase()}
    </span>
  );
}
