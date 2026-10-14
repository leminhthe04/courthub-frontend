'use client';

import { useTranslations } from 'next-intl';
import type { BookingDateFilter } from '../lib/booking-filters';

interface BookingDateFilterProps {
  value: BookingDateFilter;
  from: string;
  to: string;
  onChange: (value: BookingDateFilter) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function BookingDateFilter({
  value,
  from,
  to,
  onChange,
  onFromChange,
  onToChange,
}: BookingDateFilterProps) {
  const t = useTranslations('bookingFilters');
  const options: Array<[BookingDateFilter, string]> = [
    ['ALL', t('all')],
    ['TODAY', t('today')],
    ['THIS_WEEK', t('thisWeek')],
    ['THIS_MONTH', t('thisMonth')],
  ];
  const handleChange = (nextValue: BookingDateFilter) => {
    onChange(nextValue);
    if (nextValue !== 'CUSTOM') {
      onFromChange('');
      onToChange('');
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3 rounded border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-2">
        {options.map(([option, label]) => (
          <button
            key={option}
            type="button"
            onClick={() => handleChange(option)}
            className={`rounded px-3 py-2 text-sm font-bold transition ${
              value === option
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
        <label>
          <span className="sr-only">{t('from')}</span>
          <input
            type="date"
            value={from}
            onChange={(event) => {
              onChange('CUSTOM');
              onFromChange(event.target.value);
            }}
            className="rounded border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 outline-none focus:border-emerald-600"
          />
        </label>
        <span>–</span>
        <label>
          <span className="sr-only">{t('to')}</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              onChange('CUSTOM');
              onToChange(event.target.value);
            }}
            className="rounded border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 outline-none focus:border-emerald-600"
          />
        </label>
      </div>
    </div>
  );
}
