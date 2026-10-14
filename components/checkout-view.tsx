'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCreateBooking, useCurrentUser, useVenueDetail } from '../hooks';
import {
  calculateBookingPrice,
  formatCurrency,
  formatSlotSummary,
  formatWeekday,
  getLocalizedErrorMessage,
  pricingRulesForDate,
} from '../lib/formatters';
import { clearVenueBookingSelection, getVietnamDateKey } from '../lib/booking-selection-storage';
import { Link } from '../lib/i18n/routing';
import { showToast } from '../lib/toast';
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

  const [contactName, setContactName] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState<BookingResult | null>(null);

  const { user: currentUser } = useCurrentUser();
  const venue = useVenueDetail(venueId);

  const selectedCourt = useMemo(
    () => venue.data?.courts?.find((court) => court.id === courtId),
    [venue.data, courtId],
  );

  const selectedDatePricingRules = useMemo(
    () => pricingRulesForDate(bookingDate, venue.data?.pricingRules),
    [bookingDate, venue.data?.pricingRules],
  );

  const durationMinutes = useMemo(() => {
    if (!startAt || !endAt) return 0;
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    return Math.max(0, Math.round((end - start) / 60000));
  }, [startAt, endAt]);

  const total = useMemo(() => {
    if (!startAt || !endAt) return 0;
    return calculateBookingPrice(startAt, endAt, selectedDatePricingRules);
  }, [startAt, endAt, selectedDatePricingRules]);

  const createBooking = useCreateBooking({
    onSuccess: (result) => {
      setSuccess(result);
      if (venueId && bookingDate) {
        clearVenueBookingSelection(venueId, bookingDate);
      }
    },
    onError: (error) => {
      showToast.error(getLocalizedErrorMessage(error, tErrors));
    },
  });

  const handleBookingSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!courtId || !startAt || !endAt) return;

    createBooking.mutate({
      courtId,
      startAt,
      endAt,
      contactName: contactName ?? currentUser?.fullName ?? '',
      contactEmail:
        contactEmail === null
          ? currentUser?.email?.trim() || undefined
          : contactEmail.trim() || undefined,
      contactPhone: contactPhone ?? currentUser?.phone ?? undefined,
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
          className="mt-6 inline-flex rounded bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition"
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
      </div>

      {success ? (
        <div className="mx-auto mt-8 max-w-xl rounded border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-900">{t('successTitle')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('successSubtitle')}</p>

          <div className="mt-6 rounded bg-slate-50 p-4 border border-slate-100 text-left">
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

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href={currentUser ? '/history' : '/'}
              className="rounded border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {currentUser ? t('viewDashboard') : t('backToVenues')}
            </Link>
            <Link
              href={backUrl}
              className="rounded bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition"
            >
              {t('bookAnother')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Checkout Form */}
          <div className="space-y-6">
            <div className="rounded border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <h2 className="text-xl font-black text-slate-900">{t('contactInfo')}</h2>

              {!currentUser && (
                <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
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
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('contactName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={contactName ?? currentUser?.fullName ?? ''}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t('contactNamePlaceholder')}
                    className="mt-1.5 w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('contactEmail')}
                  </label>
                  <input
                    type="email"
                    value={contactEmail ?? currentUser?.email ?? ''}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t('contactEmailPlaceholder')}
                    className="mt-1.5 w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    {t('contactPhone')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={contactPhone ?? currentUser?.phone ?? ''}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={t('contactPhonePlaceholder')}
                    className="mt-1.5 w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">{t('note')}</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('notePlaceholder')}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createBooking.isPending}
                  className="mt-4 w-full cursor-pointer rounded bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60 transition"
                >
                  {createBooking.isPending ? t('submitting') : t('submitBooking')}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary Column (The moved aside) */}
          <aside className="space-y-6">
            <div className="rounded border border-slate-200 bg-white p-6 shadow-xs">
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
                    {formatSlotSummary(startAt, endAt, durationMinutes, t('minutes'), locale)}
                  </span>
                </div>

                {selectedDatePricingRules.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold block text-slate-700">
                      {t('pricingBySlotForDay', {
                        day: formatWeekday(bookingDate, locale),
                      })}
                      :
                    </span>
                    {selectedDatePricingRules.map((rule) => (
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
