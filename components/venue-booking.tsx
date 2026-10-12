'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useCreateBooking, useCurrentUser, useVenueDetail, useVenueSchedule } from '../hooks';
import { formatCurrency, formatDateTime, getLocalizedErrorMessage } from '../lib/formatters';
import { Link } from '../lib/i18n/routing';
import type { BookingResult } from '../lib/types';
import { ScheduleGrid } from './schedule-grid';

function todayVietnam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

function calculateBookingPrice(
  startAt: string,
  endAt: string,
  pricingRules?: import('../lib/types').VenuePricingRule[],
): number {
  if (!pricingRules || pricingRules.length === 0) return 0;
  const start = new Date(startAt);
  const end = new Date(endAt);
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (durationMinutes <= 0) return 0;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(start);
  const startH = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const startM = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const startMinutes = startH * 60 + startM;

  const slotCount = Math.round(durationMinutes / 30);
  let totalCost = 0;
  for (let i = 0; i < slotCount; i++) {
    const slotStart = startMinutes + i * 30;
    const slotEnd = slotStart + 30;
    const rule = pricingRules.find((r) => {
      const [sh, sm] = r.startTime.slice(0, 5).split(':').map(Number);
      const [eh, em] = r.endTime.slice(0, 5).split(':').map(Number);
      const rStart = sh * 60 + sm;
      const rEnd = eh * 60 + em;
      return rStart <= slotStart && slotEnd <= rEnd;
    });
    if (rule) {
      totalCost += Number(rule.hourlyRate) * 0.5;
    }
  }
  return totalCost;
}

export function VenueBooking({ venueId }: { venueId: string }) {
  const locale = useLocale();
  const t = useTranslations('booking');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');

  const [date, setDate] = useState(todayVietnam);
  const [selection, setSelection] = useState<{
    courtId: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
  } | null>(null);
  const [guestName, setGuestName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState<BookingResult | null>(null);

  const { user: currentUser } = useCurrentUser();
  const venue = useVenueDetail(venueId);
  const schedule = useVenueSchedule(venueId, date, Boolean(venue.data));

  const selectedCourt = useMemo(
    () => schedule.data?.courts.find((court) => court.id === selection?.courtId),
    [schedule.data, selection],
  );
  const total = useMemo(() => {
    if (!selection) return 0;
    const rules = venue.data?.pricingRules ?? schedule.data?.venue.pricingRules;
    return calculateBookingPrice(selection.startAt, selection.endAt, rules);
  }, [selection, venue.data?.pricingRules, schedule.data?.venue.pricingRules]);

  const createBooking = useCreateBooking({
    onSuccess: (result) => {
      setSuccess(result);
      setSelection(null);
      setNote('');
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
    if (!selection) return;

    createBooking.mutate({
      courtId: selection.courtId,
      startAt: selection.startAt,
      endAt: selection.endAt,
      guestName: currentUser ? undefined : guestName,
      contactPhone: contactPhone || undefined,
      note: note || undefined,
    });
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
    <div className="mx-auto max-w-7xl px-5 py-10">
      <Link href="/" className="text-sm font-bold text-emerald-600 hover:underline">
        ← {tCommon('back')}
      </Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="bg-slate-950 p-8 text-white sm:p-10">
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
              {venue.data.description ?? '...'}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
                CourtHub Schedule
              </p>
              <h2 className="mt-1 text-2xl font-black">{t('selectCourtAndSlot')}</h2>
            </div>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-600">
              {t('selectDate')}:{' '}
              <input
                type="date"
                value={date}
                min={todayVietnam()}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSelection(null);
                  setSuccess(null);
                }}
                className="border border-slate-200 bg-white px-4 py-2 font-normal outline-none focus:border-emerald-500"
              />
            </label>
          </div>
          <div className="mt-5">
            {schedule.isLoading && (
              <div className="border border-slate-200 bg-white p-8 text-slate-500">
                {tCommon('loading')}
              </div>
            )}
            {schedule.isError && (
              <div className="border border-rose-200 bg-rose-50 p-6 text-rose-700">
                {tErrors('default')}
              </div>
            )}
            {schedule.data && <ScheduleGrid schedule={schedule.data} onSelect={setSelection} />}
          </div>
        </section>

        <aside className="h-fit border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          {success ? (
            <div>
              <div className="grid h-12 w-12 place-items-center bg-emerald-100 text-2xl text-emerald-600">
                ✓
              </div>
              <h2 className="mt-4 text-2xl font-black">{t('successTitle')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t('bookingId')}: <strong>{success.booking.id.slice(0, 8).toUpperCase()}</strong>.
              </p>
              {success.guestToken && (
                <p className="mt-4 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                  {t('guestTokenNotice')}
                  <br />
                  <strong className="font-mono">{success.guestToken}</strong>
                </p>
              )}
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="mt-5 w-full cursor-pointer bg-slate-950 px-4 py-3 font-bold text-white hover:bg-emerald-600"
              >
                {t('bookAnother')}
              </button>
            </div>
          ) : selection && selectedCourt ? (
            <form onSubmit={handleBookingSubmit}>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">
                {tCommon('confirm')}
              </p>
              <h2 className="mt-2 text-2xl font-black">{selectedCourt.name}</h2>
              <div className="mt-4 space-y-2 bg-slate-50 p-4 text-sm text-slate-600">
                <p>{formatDateTime(selection.startAt, locale)}</p>
                <p>→ {formatDateTime(selection.endAt, locale)}</p>
                <p>{selection.durationMinutes} min</p>
                <p className="pt-2 text-lg font-black text-slate-950">
                  {formatCurrency(total, locale)}
                </p>
              </div>
              {!currentUser && (
                <>
                  <p className="mt-5 text-sm leading-6 text-slate-600">{t('contactInfo')}</p>
                  <input
                    required
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder={t('guestNamePlaceholder')}
                    className="mt-3 w-full border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </>
              )}
              <input
                required={!currentUser?.phone && !contactPhone}
                value={contactPhone || currentUser?.phone || ''}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder={t('contactPhonePlaceholder')}
                className="mt-3 w-full border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t('notePlaceholder')}
                rows={3}
                className="mt-3 w-full resize-none border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
              {!currentUser && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  <Link href="/login" className="font-bold text-emerald-600 hover:underline">
                    {t('viewDashboard')}
                  </Link>
                </p>
              )}
              {createBooking.isError && (
                <p className="mt-3 bg-rose-50 p-3 text-sm text-rose-700">
                  {getLocalizedErrorMessage(createBooking.error, tErrors)}
                </p>
              )}
              <button
                type="submit"
                disabled={createBooking.isPending}
                className="mt-5 w-full cursor-pointer bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
              >
                {createBooking.isPending ? t('submitting') : t('submitBooking')}
              </button>
            </form>
          ) : (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">
                {t('selectedSlot')}
              </p>
              <h2 className="mt-2 text-2xl font-black">{t('selectCourtAndSlot')}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t('promptSelectSlot')}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
