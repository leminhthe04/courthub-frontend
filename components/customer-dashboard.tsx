'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCancelBooking, useCurrentUser, useMyBookings } from '../hooks';
import { formatCurrency, formatDateTime, getLocalizedErrorMessage } from '../lib/formatters';
import { Link } from '../lib/i18n/routing';

export function CustomerDashboard() {
  const locale = useLocale();
  const t = useTranslations('customerDashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const me = useCurrentUser();
  const bookings = useMyBookings(Boolean(me.user));
  const cancel = useCancelBooking();

  if (me.isLoading) {
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
      <h1 className="mt-2 text-4xl font-black tracking-tight">
        {t('title')} - {me.user.fullName}
      </h1>
      <p className="mt-3 text-slate-500">{t('subtitle')}</p>
      {bookings.isError && (
        <p className="mt-8 bg-rose-50 p-4 text-rose-700">
          {getLocalizedErrorMessage(bookings.error, tErrors)}
        </p>
      )}
      {bookings.isLoading && <p className="mt-8 text-slate-500">{tCommon('loading')}</p>}
      {!bookings.isLoading && bookings.data?.length === 0 && (
        <div className="mt-8 border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">{t('noBookings')}</p>
          <Link href="/" className="mt-4 inline-flex font-bold text-emerald-600 hover:underline">
            {tCommon('search')} →
          </Link>
        </div>
      )}
      <div className="mt-8 grid gap-4">
        {bookings.data?.map((booking) => (
          <article
            key={booking.id}
            className="flex flex-col justify-between gap-5 border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold">
                  {booking.venueName} · {booking.courtName}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-bold ${
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
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {formatDateTime(booking.startAt, locale)} → {formatDateTime(booking.endAt, locale)}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {formatCurrency(booking.totalAmount, locale)}
              </p>
            </div>
            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('cancelConfirm'))) {
                    cancel.mutate({ id: booking.id });
                  }
                }}
                disabled={cancel.isPending}
                className="cursor-pointer border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
              >
                {cancel.isPending ? t('cancelling') : t('cancelBooking')}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
