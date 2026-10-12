'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useCreateBooking, useCurrentUser, useVenueDetail } from '../hooks';
import {
  calculateBookingPrice,
  formatCurrency,
  formatSlotSummary,
  getLocalizedErrorMessage,
  pricingRulesForDate,
} from '../lib/formatters';
import { clearVenueBookingSelection, getVietnamDateKey } from '../lib/booking-selection-storage';
import { Link } from '../lib/i18n/routing';
import type { BookingResult } from '../lib/types';

export function CheckoutView() {
  const locale = useLocale();
  const t = useTranslations('booking');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');

  const searchParams = useSearchParams();
  const venueId = searchParams.get('venueId') ?? '';
  const courtId = searchParams.get('courtId') ?? '';
  const startAt = searchParams.get('startAt') ?? '';
  const endAt = searchParams.get('endAt') ?? '';
  const bookingDate = searchParams.get('date') ?? (startAt ? getVietnamDateKey(startAt) : '');

  const [guestName, setGuestName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState<BookingResult | null>(null);

  const { user: currentUser } = useCurrentUser();
  const venue = useVenueDetail(venueId);

  const selectedCourt = useMemo(
    () => venue.data?.courts.find((court) => court.id === courtId),
    [venue.data, courtId],
  );

  const durationMinutes = useMemo(() => {
    if (!startAt || !endAt) return 0;
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    return Math.max(0, Math.round((end - start) / 60000));
  }, [startAt, endAt]);

  const total = useMemo(() => {
    if (!startAt || !endAt) return 0;
    return calculateBookingPrice(
      startAt,
      endAt,
      pricingRulesForDate(bookingDate, venue.data?.pricingRules),
    );
  }, [bookingDate, startAt, endAt, venue.data?.pricingRules]);

  const createBooking = useCreateBooking({
    onSuccess: (result) => {
      setSuccess(result);
      if (venueId && bookingDate) {
        clearVenueBookingSelection(venueId, bookingDate);
      }
      if (result.guestToken && typeof window !== 'undefined') {
        window.localStorage.setItem(
          `courthub:guest-booking:${result.booking.id}`,
          result.guestToken,
        );
      }
    },
  });

  const handleBookingSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!courtId || !startAt || !endAt) return;

    createBooking.mutate({
      courtId,
      startAt,
      endAt,
      guestName: currentUser ? undefined : guestName,
      contactPhone: contactPhone || undefined,
      note: note || undefined,
    });
  };

  const backUrl = venueId ? `/venues/${venueId}` : '/';

  if (!venueId || !courtId || !startAt || !endAt) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-600">
          ⚠️
        </div>
        <h1 className="mt-4 text-2xl font-black text-slate-900">{t('noBookingInfo')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('noBookingInfoDesc')}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition"
        >
          {t('backToVenues')}
        </Link>
      </div>
    );
  }

  if (venue.isLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">{tCommon('loading')}</div>;
  }

  if (venue.isError || !venue.data) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-rose-700">{tErrors('VENUE_NOT_FOUND')}</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link href={backUrl} className="text-sm font-bold text-emerald-600 hover:underline">
        {'< ' + t('backToSchedule')}
      </Link>

      <div className="mt-4 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('checkoutTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('checkoutSubtitle')}</p>
      </div>

      {success ? (
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            ✓
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-900">{t('successTitle')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('successSubtitle')}</p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100 text-left">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">{t('bookingId')}</span>
              <strong className="font-mono text-slate-900 font-extrabold">
                {success.booking.id.slice(0, 8).toUpperCase()}
              </strong>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">{t('court')}</span>
              <strong className="text-slate-900">{selectedCourt?.name}</strong>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">{t('total')}</span>
              <strong className="text-emerald-700">{formatCurrency(total, locale)}</strong>
            </div>
          </div>

          {success.guestToken && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-5 text-amber-900">
              <p className="font-semibold">{t('guestTokenNotice')}</p>
              <p className="mt-2 font-mono font-bold text-sm bg-white/70 p-2 rounded border border-amber-300 select-all">
                {success.guestToken}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href={currentUser ? '/dashboard' : '/'}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {currentUser ? t('viewDashboard') : t('backToVenues')}
            </Link>
            <Link
              href={backUrl}
              className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition"
            >
              {t('bookAnother')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Checkout Form */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <h2 className="text-xl font-black text-slate-900">{t('contactInfo')}</h2>

              {currentUser ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white uppercase">
                      {(
                        currentUser.fullName ||
                        currentUser.email ||
                        currentUser.phone ||
                        'U'
                      ).slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">{t('loggedInAs')}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {currentUser.fullName || currentUser.email || currentUser.phone}
                      </p>
                      <p className="text-xs text-slate-500">
                        {currentUser.email ?? currentUser.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <span>{t('alreadyHaveAccount')} </span>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(
                      `/checkout?venueId=${venueId}&date=${bookingDate}&courtId=${courtId}&startAt=${startAt}&endAt=${endAt}`,
                    )}`}
                    className="font-bold text-emerald-600 hover:underline"
                  >
                    {t('loginNow')}
                  </Link>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="mt-6 space-y-4">
                {!currentUser && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      {t('guestName')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={t('guestNamePlaceholder')}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('contactPhone')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required={!currentUser?.phone && !contactPhone}
                    value={contactPhone || currentUser?.phone || ''}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={t('contactPhonePlaceholder')}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">{t('note')}</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('notePlaceholder')}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {createBooking.isError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                    {getLocalizedErrorMessage(createBooking.error, tErrors)}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createBooking.isPending}
                  className="mt-4 w-full cursor-pointer rounded-xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60 transition"
                >
                  {createBooking.isPending ? t('submitting') : t('submitBooking')}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary Column (The moved aside) */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-black text-slate-900">{t('orderSummary')}</h2>

              <div className="mt-4 border-b border-slate-100 pb-4">
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {venue.data.sportType}
                </span>
                <h3 className="mt-2 text-lg font-black text-slate-900">{venue.data.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {venue.data.address}, {venue.data.city}
                </p>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('court')}</span>
                  <strong className="text-slate-900 font-bold">{selectedCourt?.name}</strong>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t('time')}
                  </span>
                  <span className="mt-1 block font-extrabold text-slate-800 text-sm">
                    {formatSlotSummary(startAt, endAt, durationMinutes, t('minutes'))}
                  </span>
                </div>

                {venue.data.pricingRules && venue.data.pricingRules.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold block text-slate-700">Giá theo khung giờ:</span>
                    {venue.data.pricingRules.map((rule) => (
                      <div key={rule.id} className="flex justify-between">
                        <span>
                          {rule.startTime.slice(0, 5)} - {rule.endTime.slice(0, 5)}
                        </span>
                        <span className="font-bold text-slate-700">
                          {formatCurrency(rule.hourlyRate, locale)}/h
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
                  <span className="text-base font-bold text-slate-900">{t('total')}</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {formatCurrency(total, locale)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
