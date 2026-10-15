'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { usePartnerBookings } from '../hooks';
import {
  filterBookings,
  groupBookingsByDate,
  type BookingDateFilter as BookingDateFilterValue,
} from '../lib/booking-filters';
import { formatCurrency, formatDateTime, formatTimeRange } from '../lib/formatters';
import type { PartnerBooking } from '../lib/types';
import { BookingDateFilter } from './booking-date-filter';
import { BookingStatusBadge } from './booking-status-badge';

interface PartnerVenueBookingsTabProps {
  venueId: string;
}

export function PartnerVenueBookingsTab({ venueId }: PartnerVenueBookingsTabProps) {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');
  const [filter, setFilter] = useState<BookingDateFilterValue>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const bookings = usePartnerBookings();
  const venueBookings = (bookings.data ?? []).filter((booking) => booking.venueId === venueId);
  const groups = useMemo(
    () => groupBookingsByDate(filterBookings(venueBookings, filter, from, to), locale),
    [venueBookings, filter, from, to, locale],
  );

  return (
    <section className="mt-8 min-h-[32rem]">
      <h2 className="text-xl font-black text-slate-900">{t('venueBookingsTitle')}</h2>
      <BookingDateFilter
        value={filter}
        from={from}
        to={to}
        onChange={setFilter}
        onFromChange={setFrom}
        onToChange={setTo}
      />
      {bookings.isLoading && <p className="mt-6 text-slate-500">{tCommon('loading')}</p>}
      {bookings.isError && <p className="mt-6 text-rose-600">{t('venueBookingsLoadError')}</p>}
      {!bookings.isLoading && !bookings.isError && groups.length === 0 && (
        <div className="mt-6 rounded border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {t('noVenueBookings')}
        </div>
      )}
      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.date}>
            <h3 className="mb-3 text-lg font-black text-slate-900">{group.label}</h3>
            <div className="grid gap-4">
              {group.items.map((booking: PartnerBooking) => (
                <article
                  key={booking.id}
                  className="rounded border border-slate-200 bg-white px-5 py-3 shadow-sm"
                >
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {booking.courtName} - {formatTimeRange(booking.startAt, booking.endAt)}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {booking.contactName} - {booking.contactPhone} -{' '}
                        {booking.contactEmail || '—'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {t('bookedAt') + formatDateTime(booking.createdAt)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <BookingStatusBadge status={booking.status} translate={tCommon} />
                      <p className="mt-3 font-bold text-slate-900">
                        {formatCurrency(booking.totalAmount, locale)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
