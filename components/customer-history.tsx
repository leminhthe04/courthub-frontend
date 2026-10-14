'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCurrentUser, useMyBookings } from '../hooks';
import {
  filterBookings,
  groupBookingsByDate,
  type BookingDateFilter as BookingDateFilterValue,
} from '../lib/booking-filters';
import { formatCurrency, formatTimeRange, getLocalizedErrorMessage } from '../lib/formatters';
import { Link, useRouter } from '../lib/i18n/routing';
import { BookingDateFilter } from './booking-date-filter';
import { ScrollableBookingList } from './scrollable-booking-list';

export function CustomerHistory() {
  const locale = useLocale();
  const t = useTranslations('customerHistory');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [filter, setFilter] = useState<BookingDateFilterValue>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const me = useCurrentUser();
  const isCustomer = me.user?.role === 'CUSTOMER';
  const bookings = useMyBookings(Boolean(me.user && isCustomer));
  const groups = useMemo(
    () => groupBookingsByDate(filterBookings(bookings.data ?? [], filter, from, to), locale),
    [bookings.data, filter, from, to, locale],
  );

  useEffect(() => {
    if (!me.isLoading && me.user?.role === 'PARTNER') {
      router.replace('/partner');
    }
  }, [me.user, me.isLoading, router]);

  if (me.isLoading || me.user?.role === 'PARTNER') {
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">{tCommon('loading')}</div>;
  }

  if (me.isError || !me.user) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-3 text-slate-500">{t('subtitle')}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex bg-slate-950 px-5 py-3 font-bold text-white hover:bg-emerald-600"
        >
          {tCommon('confirm')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Customer</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{t('title')}</h1>
      <BookingDateFilter
        value={filter}
        from={from}
        to={to}
        onChange={setFilter}
        onFromChange={setFrom}
        onToChange={setTo}
      />
      {bookings.isError && (
        <p className="mt-8 bg-rose-50 p-4 text-rose-700">
          {getLocalizedErrorMessage(bookings.error, tErrors)}
        </p>
      )}
      {bookings.isLoading && <p className="mt-8 text-slate-500">{tCommon('loading')}</p>}
      {!bookings.isLoading && groups.length === 0 && (
        <div className="mt-8 border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">{t('noBookings')}</p>
          <Link href="/" className="mt-4 inline-flex font-bold text-emerald-600 hover:underline">
            {tCommon('search')} →
          </Link>
        </div>
      )}
      <ScrollableBookingList>
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-3 text-lg font-black text-slate-900">{group.label}</h2>
              <div className="grid gap-4">
                {group.items.map((booking) => (
                  <article
                    key={booking.id}
                    className="flex flex-col justify-between gap-5 rounded border border-slate-200 bg-white px-5 py-3 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="text-lg font-bold">
                        {booking.venueName} · {booking.courtName} --{' '}
                        {formatTimeRange(booking.startAt, booking.endAt)}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">{booking.venueAddress}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span
                        className={`rounded px-3 py-1 text-xs font-bold ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {booking.status === 'CONFIRMED'
                          ? tCommon('status.confirmed')
                          : booking.status === 'PENDING'
                            ? tCommon('status.pending')
                            : booking.status === 'CANCELLED'
                              ? tCommon('status.cancelled')
                              : booking.status}
                      </span>
                      <p className="mt-3 font-bold text-slate-950">
                        {formatCurrency(booking.totalAmount, locale)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ScrollableBookingList>
    </div>
  );
}
