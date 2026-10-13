'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency } from '../lib/formatters';
import type { AdminBooking } from '../lib/types';

interface AdminBookingsTabProps {
  bookings: AdminBooking[];
}

export function AdminBookingsTab({ bookings }: AdminBookingsTabProps) {
  const locale = useLocale();
  const t = useTranslations('adminDashboard');

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-black text-slate-900">{t('systemBookings')}</h2>
      <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Venue / Court</th>
              <th className="px-5 py-4">{locale === 'vi' ? 'Số điện thoại' : 'Phone'}</th>
              <th className="px-5 py-4">{locale === 'vi' ? 'Trạng thái' : 'Status'}</th>
              <th className="px-5 py-4">{locale === 'vi' ? 'Tổng tiền' : 'Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.slice(0, 20).map((booking) => (
              <tr key={booking.id} className="transition hover:bg-slate-50/60">
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {booking.venueName} · {booking.courtName}
                </td>
                <td className="px-5 py-4 text-slate-600">{booking.contactPhone}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
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
                <td className="px-5 py-4 font-medium text-slate-900">
                  {formatCurrency(booking.totalAmount, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
