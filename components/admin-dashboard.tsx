'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useAdminBookings, useAdminVenues, useCurrentUser, useReviewVenue } from '../hooks';
import { formatCurrency } from '../lib/formatters';

export function AdminDashboard() {
  const locale = useLocale();
  const t = useTranslations('adminDashboard');
  const tCommon = useTranslations('common');

  const me = useCurrentUser();
  const isAdmin = me.user?.role === 'ADMIN';

  const venues = useAdminVenues(isAdmin);
  const bookings = useAdminBookings(isAdmin);
  const review = useReviewVenue();

  if (me.isLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">{tCommon('loading')}</div>;
  }

  if (me.isError || !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-3 text-slate-500">
          {locale === 'vi'
            ? 'Khu vực này dành riêng cho tài khoản ADMIN.'
            : 'This area is restricted to administrator accounts.'}
        </p>
      </div>
    );
  }

  const pendingCount = venues.data?.filter((item) => item.status === 'PENDING').length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Operations</p>
      <h1 className="mt-2 text-4xl font-black">{t('title')}</h1>
      <p className="mt-2 text-slate-600">{t('subtitle')}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Venues" value={venues.data?.length ?? 0} />
        <Metric label="Bookings" value={bookings.data?.length ?? 0} />
        <Metric label={tCommon('status.pending')} value={pendingCount} />
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-black">{t('pendingVenues')}</h2>
        <div className="mt-4 grid gap-3">
          {pendingCount === 0 && (
            <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              {t('noPendingVenues')}
            </div>
          )}
          {venues.data
            ?.filter((item) => item.status === 'PENDING')
            .map((venue) => (
              <article
                key={venue.id}
                className="flex flex-col justify-between gap-4 border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-bold">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {venue.sportType} · {venue.address}, {venue.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => review.mutate({ id: venue.id, action: 'reject' })}
                    disabled={review.isPending}
                    className="cursor-pointer border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
                  >
                    {t('reject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => review.mutate({ id: venue.id, action: 'approve' })}
                    disabled={review.isPending}
                    className="cursor-pointer bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    {t('approve')}
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-black">{t('systemBookings')}</h2>
        <div className="mt-4 overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Venue / Court</th>
                <th className="px-5 py-4">{locale === 'vi' ? 'Số điện thoại' : 'Phone'}</th>
                <th className="px-5 py-4">{locale === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="px-5 py-4">{locale === 'vi' ? 'Tổng tiền' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.data?.slice(0, 20).map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100">
                  <td className="px-5 py-4 font-semibold">
                    {booking.venueName} · {booking.courtName}
                  </td>
                  <td className="px-5 py-4">{booking.contactPhone}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold ${
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
                  <td className="px-5 py-4 font-medium">
                    {formatCurrency(booking.totalAmount, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
