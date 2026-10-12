'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useBookingSelection } from '../hooks/use-booking-selection';
import { useCurrentUser, useVenueDetail, useVenueSchedule } from '../hooks';
import { getVietnamDateKey } from '../lib/booking-selection-storage';
import {
  calculateBookingPrice,
  formatCurrency,
  formatSlotSummary,
  pricingRulesForDate,
} from '../lib/formatters';
import { Link, useRouter } from '../lib/i18n/routing';
import type { ScheduleResponse } from '../lib/types';
import { ScheduleGrid } from './schedule-grid';

function todayVietnam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

function isSelectionAvailable(
  schedule: ScheduleResponse,
  selection: {
    courtId: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
  },
): boolean {
  const start = new Date(selection.startAt).getTime();
  const end = new Date(selection.endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
  if (getVietnamDateKey(selection.startAt) !== schedule.date) return false;
  if (getVietnamDateKey(selection.endAt) !== schedule.date) return false;
  if ((end - start) / 60000 !== selection.durationMinutes) return false;

  const court = schedule.courts.find((item) => item.id === selection.courtId);
  if (!court || !court.isActive) return false;

  return !court.bookings.some((booking) => {
    const bookingStart = new Date(booking.startAt).getTime();
    const bookingEnd = new Date(booking.endAt).getTime();
    return bookingStart < end && bookingEnd > start;
  });
}

export function VenueBooking({ venueId }: { venueId: string }) {
  const locale = useLocale();
  const t = useTranslations('booking');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  const { date, selection, isReady, selectDate, updateSelection } = useBookingSelection(
    venueId,
    todayVietnam(),
  );

  const { user: currentUser } = useCurrentUser();
  const venue = useVenueDetail(venueId);
  const schedule = useVenueSchedule(venueId, date, {
    enabled: Boolean(venue.data) && isReady,
    minDate: todayVietnam(),
  });

  useEffect(() => {
    if (!isReady || !selection || !schedule.data) return;

    if (!isSelectionAvailable(schedule.data, selection)) {
      updateSelection(null);
      // The notice intentionally follows the persisted-state validation above.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectionNotice(t('savedSelectionUnavailable'));
    }
  }, [isReady, schedule.data, selection, t, updateSelection]);

  const selectedCourt = useMemo(
    () => schedule.data?.courts.find((court) => court.id === selection?.courtId),
    [schedule.data, selection],
  );

  const total = useMemo(() => {
    if (!selection) return 0;
    const rules = pricingRulesForDate(
      date,
      venue.data?.pricingRules ?? schedule.data?.venue.pricingRules,
    );
    return calculateBookingPrice(selection.startAt, selection.endAt, rules);
  }, [date, selection, venue.data?.pricingRules, schedule.data?.venue.pricingRules]);

  const getCheckoutUrl = () => {
    if (!selection) return '';
    return `/checkout?venueId=${venueId}&date=${date}&courtId=${selection.courtId}&startAt=${selection.startAt}&endAt=${selection.endAt}`;
  };

  const handleProceedToBooking = () => {
    if (!selection) return;
    const checkoutUrl = getCheckoutUrl();
    if (currentUser) {
      router.push(checkoutUrl);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  if (venue.isLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">{tCommon('loading')}</div>;
  }
  if (venue.isError || !venue.data) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-rose-700">{tErrors('VENUE_NOT_FOUND')}</div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 pb-28">
      <Link href="/" className="text-sm font-bold text-emerald-600 hover:underline">
        {'< ' + tCommon('back')}
      </Link>

      <div className="mt-5">
        <section className="min-w-0">
          {/* Venue Header Card */}
          {/* <div className="bg-slate-950 p-8 text-white sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span className="bg-emerald-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {venue.data.sportType}
                </span>
                <h1 className="mt-4 text-4xl font-black tracking-tight">{venue.data.name}</h1>
                <p className="mt-3 text-slate-300">
                  {venue.data.address}, {venue.data.city}
                </p>
              </div>
              <div className="bg-white/10 px-5 py-4 text-right text-sm text-slate-300">
                <strong className="block text-2xl text-white">{venue.data.courts.length}</strong>{' '}
                {venue.data.courts.length === 1 ? 'court' : 'courts'}
              </div>
            </div>
            <p className="mt-8 max-w-2xl leading-7 text-slate-300">
              {venue.data.description ?? ''}
            </p>
          </div> */}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    {venue.data.sportType}
                  </span>
                </div>
                <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                  {venue.data.name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {venue.data.address}, {venue.data.city}
                </p>
                {venue.data.description && (
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{venue.data.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Grid Card (Full width) */}
          <div className="mt-8 min-w-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="mt-1 text-xl font-black text-slate-900">{t('selectCourtAndSlot')}</h2>
            </div>

            <div className="mt-6">
              {schedule.isLoading && (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  {tCommon('loading')}
                </div>
              )}
              {schedule.isError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
                  {tErrors('default')}
                </div>
              )}
              {selectionNotice && (
                <div className="mb-4 border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                  {selectionNotice}
                </div>
              )}
              {schedule.data && (
                <ScheduleGrid
                  schedule={schedule.data}
                  selectedRange={selection}
                  onSelect={(nextSelection) => {
                    setSelectionNotice(null);
                    updateSelection(nextSelection);
                  }}
                  onDateChange={(newDate) => {
                    setSelectionNotice(null);
                    selectDate(newDate);
                  }}
                  minDate={todayVietnam()}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Floating Sticky Bottom Bar when slot is selected */}
      {selection && selectedCourt && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-5 py-3.5 shadow-2xl backdrop-blur-md transition">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {selectedCourt.name}
                </p>
                <p className="text-sm font-extrabold text-slate-900">
                  {formatSlotSummary(
                    selection.startAt,
                    selection.endAt,
                    selection.durationMinutes,
                    t('minutes'),
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-xs font-medium text-slate-500">{t('total')}</span>
                <span className="text-lg font-black text-emerald-600">
                  {formatCurrency(total, locale)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleProceedToBooking}
                className="cursor-pointer rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition flex items-center gap-1.5"
              >
                <span>{t('proceedToBooking')}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal when clicking Proceed without being logged in */}
      {isAuthModalOpen && selection && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs transition-opacity"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              aria-label={tCommon('cancel')}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h3 className="text-xl font-black text-slate-900">{t('modalTitle')}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('modalSubtitle')}</p>

            <div className="mt-4 rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-700">
              <div className="font-bold text-slate-900">{selectedCourt?.name}</div>
              <div className="mt-1 text-slate-600">
                {formatSlotSummary(
                  selection.startAt,
                  selection.endAt,
                  selection.durationMinutes,
                  t('minutes'),
                )}
              </div>
              <div className="mt-1 font-extrabold text-emerald-700">
                {formatCurrency(total, locale)}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  const checkoutUrl = getCheckoutUrl();
                  router.push(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
                }}
                className="w-full cursor-pointer rounded-xl bg-emerald-600 px-5 py-3.5 text-center text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                {t('loginToContinue')}
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push(getCheckoutUrl());
                }}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-center text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
              >
                {t('continueAsGuest')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
