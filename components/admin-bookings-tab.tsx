'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Fragment, useMemo, useState } from 'react';
import {
  filterBookings,
  groupBookingsByDate,
  type BookingDateFilter as BookingDateFilterValue,
} from '../lib/booking-filters';
import { formatCurrency, formatTimeRange } from '../lib/formatters';
import type { AdminBooking } from '../lib/types';
import { BookingDateFilter } from './booking-date-filter';

interface AdminBookingsTabProps {
  bookings: AdminBooking[];
}

export function AdminBookingsTab({ bookings }: AdminBookingsTabProps) {
  const locale = useLocale();
  const t = useTranslations('adminDashboard');
  const [filter, setFilter] = useState<BookingDateFilterValue>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const groups = useMemo(
    () => groupBookingsByDate(filterBookings(bookings, filter, from, to), locale),
    [bookings, filter, from, to, locale],
  );

  return (
    <section className="mt-8 min-h-[32rem]">
      <h2 className="text-2xl font-black text-slate-900">{t('systemBookings')}</h2>
      <BookingDateFilter
        value={filter}
        from={from}
        to={to}
        onChange={setFilter}
        onFromChange={setFrom}
        onToChange={setTo}
      />
      <div className="mt-4 min-h-[32rem] max-h-[70vh] overflow-x-hidden overflow-y-auto rounded border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-0 table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-center text-xs uppercase text-slate-500">
            <tr>
              <th className="w-[22%] px-3 py-4 text-center ">{t('bookingVenueCourt')}</th>
              <th className="w-[14%] px-3 py-4 text-center ">{t('bookingContactName')}</th>
              <th className="w-[13%] px-3 py-4 text-center ">{t('bookingContactPhone')}</th>
              <th className="w-[15%] px-3 py-4 text-center ">{t('bookingContactEmail')}</th>
              <th className="w-[12%] px-3 py-4 text-center ">{t('bookingTime')}</th>
              <th className="w-[12%] px-3 py-4 text-center ">{t('status')}</th>
              <th className="w-[12%] px-3 py-4 text-center ">{t('bookingTotal')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  {t('noBookingsForFilter')}
                </td>
              </tr>
            )}
            {groups.map((group) => (
              <Fragment key={group.date}>
                <tr className="bg-slate-50">
                  <th
                    colSpan={7}
                    className="bg-slate-50 px-3 py-3 text-left text-sm font-black text-slate-800"
                  >
                    {group.label}
                  </th>
                </tr>
                {group.items.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-slate-50/60">
                    <td className="max-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-3 pl-5 py-4 font-semibold text-slate-900 ">
                      {booking.venueName} · {booking.courtName}
                    </td>
                    <td className="max-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-3 py-4 text-left text-slate-600 ">
                      {booking.contactName}
                    </td>
                    <td className="max-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-3 py-4 text-center text-slate-600 ">
                      {booking.contactPhone}
                    </td>
                    <td className="max-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-3 py-4 text-left text-slate-600 ">
                      {booking.contactEmail || '—'}
                    </td>
                    <td className="max-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-3 py-4 text-center text-slate-600 ">
                      {formatTimeRange(booking.startAt, booking.endAt)}
                    </td>
                    <td className="max-w-0 overflow-hidden px-3 py-4 text-center ">
                      <span
                        className={`inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="max-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-3 pr-5 py-4 text-right font-medium text-slate-900 ">
                      {formatCurrency(booking.totalAmount, locale)}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
