'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useCreatePartnerCourt,
  useCreatePartnerVenue,
  useCurrentUser,
  usePartnerBookings,
  usePartnerVenues,
  useTransitionBooking,
} from '../hooks';
import { formatDateTime } from '../lib/formatters';

export function PartnerDashboard() {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');

  const [venueForm, setVenueForm] = useState({
    name: '',
    sportType: 'Badminton',
    address: '',
    city: 'Ho Chi Minh City',
    description: '',
  });
  const [courtForm, setCourtForm] = useState({ venueId: '', name: '', hourlyRate: '120000' });

  const me = useCurrentUser();
  const isPartner = me.user?.role === 'PARTNER';

  const venues = usePartnerVenues(isPartner);
  const bookings = usePartnerBookings(isPartner);

  const createVenue = useCreatePartnerVenue({
    onSuccess: () => {
      setVenueForm({
        name: '',
        sportType: 'Badminton',
        address: '',
        city: 'Ho Chi Minh City',
        description: '',
      });
    },
  });

  const createCourt = useCreatePartnerCourt({
    onSuccess: () => {
      setCourtForm({ ...courtForm, name: '' });
    },
  });

  const transition = useTransitionBooking();

  if (me.isLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">{tCommon('loading')}</div>;
  }

  if (me.isError || !isPartner) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-3 text-slate-500">
          {locale === 'vi'
            ? 'Khu vực này dành riêng cho tài khoản đối tác (PARTNER).'
            : 'This area is restricted to partner (PARTNER) accounts.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
        Partner Workspace
      </p>
      <h1 className="mt-2 text-4xl font-black">{t('title')}</h1>
      <p className="mt-2 text-slate-600">{t('subtitle')}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createVenue.mutate(venueForm);
          }}
          className="border border-slate-200 bg-white p-6"
        >
          <h2 className="text-xl font-black">
            {locale === 'vi' ? 'Tạo cụm sân mới' : 'Create New Venue'}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={venueForm.name}
              onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
              placeholder={locale === 'vi' ? 'Tên venue' : 'Venue name'}
              className="border border-slate-200 px-4 py-3 sm:col-span-2"
            />
            <input
              required
              value={venueForm.sportType}
              onChange={(e) => setVenueForm({ ...venueForm, sportType: e.target.value })}
              placeholder={locale === 'vi' ? 'Môn thể thao' : 'Sport'}
              className="border border-slate-200 px-4 py-3"
            />
            <input
              required
              value={venueForm.city}
              onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
              placeholder={locale === 'vi' ? 'Thành phố' : 'City'}
              className="border border-slate-200 px-4 py-3"
            />
            <input
              required
              value={venueForm.address}
              onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
              placeholder={locale === 'vi' ? 'Địa chỉ' : 'Address'}
              className="border border-slate-200 px-4 py-3 sm:col-span-2"
            />
            <textarea
              value={venueForm.description}
              onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })}
              placeholder={locale === 'vi' ? 'Mô tả' : 'Description'}
              rows={2}
              className="border border-slate-200 px-4 py-3 sm:col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={createVenue.isPending}
            className="mt-4 cursor-pointer bg-slate-950 px-5 py-3 font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {createVenue.isPending
              ? locale === 'vi'
                ? 'Đang tạo…'
                : 'Creating…'
              : locale === 'vi'
                ? 'Tạo venue'
                : 'Create Venue'}
          </button>
        </form>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createCourt.mutate({
              venueId: courtForm.venueId,
              dto: { name: courtForm.name, hourlyRate: Number(courtForm.hourlyRate) },
            });
          }}
          className="border border-slate-200 bg-white p-6"
        >
          <h2 className="text-xl font-black">{locale === 'vi' ? 'Thêm sân con' : 'Add Court'}</h2>
          <div className="mt-4 grid gap-3">
            <select
              required
              value={courtForm.venueId}
              onChange={(e) => setCourtForm({ ...courtForm, venueId: e.target.value })}
              className="border border-slate-200 bg-white px-4 py-3"
            >
              <option value="">{locale === 'vi' ? 'Chọn cụm sân' : 'Select venue'}</option>
              {venues.data?.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            <input
              required
              value={courtForm.name}
              onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
              placeholder={
                locale === 'vi' ? 'Tên sân con (VD: Sân 1)' : 'Court name (e.g. Court 1)'
              }
              className="border border-slate-200 px-4 py-3"
            />
            <input
              required
              type="number"
              min="0"
              value={courtForm.hourlyRate}
              onChange={(e) => setCourtForm({ ...courtForm, hourlyRate: e.target.value })}
              placeholder={locale === 'vi' ? 'Giá/giờ (VND)' : 'Rate/hour (VND)'}
              className="border border-slate-200 px-4 py-3"
            />
          </div>
          <button
            type="submit"
            disabled={createCourt.isPending}
            className="mt-4 cursor-pointer bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {createCourt.isPending
              ? locale === 'vi'
                ? 'Đang thêm…'
                : 'Adding…'
              : locale === 'vi'
                ? 'Thêm sân'
                : 'Add Court'}
          </button>
        </form>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl font-black">
          {locale === 'vi' ? 'Địa điểm của bạn' : 'Your Venues'}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {venues.data?.map((venue) => (
            <article key={venue.id} className="border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {venue.address}, {venue.city}
                  </p>
                </div>
                <span className="bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  {venue.status}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {venue.courts.length} courts · {venue.sportType}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-black">{t('pendingBookings')}</h2>
        <div className="mt-4 grid gap-3">
          {bookings.data?.filter((item) => item.status === 'PENDING').length === 0 && (
            <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              {t('noPending')}
            </div>
          )}
          {bookings.data
            ?.filter((item) => item.status === 'PENDING')
            .map((booking) => (
              <article
                key={booking.id}
                className="flex flex-col justify-between gap-4 border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-bold">
                    {booking.venueName} · {booking.courtName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(booking.startAt, locale)} →{' '}
                    {formatDateTime(booking.endAt, locale)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.guestName ?? 'Customer'} · {booking.contactPhone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => transition.mutate({ id: booking.id, action: 'reject' })}
                    disabled={transition.isPending}
                    className="cursor-pointer border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
                  >
                    {t('reject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => transition.mutate({ id: booking.id, action: 'confirm' })}
                    disabled={transition.isPending}
                    className="cursor-pointer bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    {t('approve')}
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
