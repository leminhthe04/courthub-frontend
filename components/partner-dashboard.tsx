'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '../lib/api';
import type { AuthUser, VenueDetail } from '../lib/types';

type PartnerBooking = {
  id: string;
  venueName: string;
  courtName: string;
  guestName: string | null;
  contactPhone: string;
  startAt: string;
  endAt: string;
  status: string;
  totalAmount: number;
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function PartnerDashboard() {
  const queryClient = useQueryClient();
  const [venueForm, setVenueForm] = useState({
    name: '',
    sportType: 'Badminton',
    address: '',
    city: 'Ho Chi Minh City',
    description: '',
  });
  const [courtForm, setCourtForm] = useState({ venueId: '', name: '', hourlyRate: '120000' });
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ user: AuthUser }>('/auth/me'),
  });
  const venues = useQuery({
    queryKey: ['partner-venues'],
    queryFn: () => apiFetch<VenueDetail[]>('/partner/venues'),
    enabled: me.data?.user.role === 'PARTNER',
  });
  const bookings = useQuery({
    queryKey: ['partner-bookings'],
    queryFn: () => apiFetch<PartnerBooking[]>('/partner/bookings'),
    enabled: me.data?.user.role === 'PARTNER',
  });
  const createVenue = useMutation({
    mutationFn: () =>
      apiFetch('/partner/venues', { method: 'POST', body: JSON.stringify(venueForm) }),
    onSuccess: () => {
      setVenueForm({
        name: '',
        sportType: 'Badminton',
        address: '',
        city: 'Ho Chi Minh City',
        description: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['partner-venues'] });
    },
  });
  const createCourt = useMutation({
    mutationFn: () =>
      apiFetch(`/partner/venues/${courtForm.venueId}/courts`, {
        method: 'POST',
        body: JSON.stringify({ name: courtForm.name, hourlyRate: Number(courtForm.hourlyRate) }),
      }),
    onSuccess: () => {
      setCourtForm({ ...courtForm, name: '' });
      void queryClient.invalidateQueries({ queryKey: ['partner-venues'] });
    },
  });
  const transition = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'confirm' | 'reject' }) =>
      apiFetch(`/partner/bookings/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partner-bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });

  if (me.isLoading)
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">Đang tải…</div>;
  if (me.isError || me.data?.user.role !== 'PARTNER')
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black">Partner dashboard</h1>
        <p className="mt-3 text-slate-500">Khu vực này dành cho tài khoản PARTNER.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
        Partner workspace
      </p>
      <h1 className="mt-2 text-4xl font-black">Quản lý sân và booking</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createVenue.mutate();
          }}
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <h2 className="text-xl font-black">Tạo venue mới</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={venueForm.name}
              onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
              placeholder="Tên venue"
              className="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2"
            />
            <input
              required
              value={venueForm.sportType}
              onChange={(e) => setVenueForm({ ...venueForm, sportType: e.target.value })}
              placeholder="Môn thể thao"
              className="rounded-xl border border-slate-200 px-4 py-3"
            />
            <input
              required
              value={venueForm.city}
              onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
              placeholder="Thành phố"
              className="rounded-xl border border-slate-200 px-4 py-3"
            />
            <input
              required
              value={venueForm.address}
              onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
              placeholder="Địa chỉ"
              className="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2"
            />
            <textarea
              value={venueForm.description}
              onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })}
              placeholder="Mô tả"
              rows={2}
              className="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2"
            />
          </div>
          <button
            disabled={createVenue.isPending}
            className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {createVenue.isPending ? 'Đang tạo…' : 'Tạo venue'}
          </button>
        </form>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createCourt.mutate();
          }}
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <h2 className="text-xl font-black">Thêm court</h2>
          <div className="mt-4 grid gap-3">
            <select
              required
              value={courtForm.venueId}
              onChange={(e) => setCourtForm({ ...courtForm, venueId: e.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <option value="">Chọn venue</option>
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
              placeholder="Tên court, ví dụ Court 1"
              className="rounded-xl border border-slate-200 px-4 py-3"
            />
            <input
              required
              type="number"
              min="0"
              value={courtForm.hourlyRate}
              onChange={(e) => setCourtForm({ ...courtForm, hourlyRate: e.target.value })}
              placeholder="Giá/giờ"
              className="rounded-xl border border-slate-200 px-4 py-3"
            />
          </div>
          <button
            disabled={createCourt.isPending}
            className="mt-4 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            Thêm court
          </button>
        </form>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl font-black">Venue của bạn</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {venues.data?.map((venue) => (
            <article key={venue.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {venue.address}, {venue.city}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  {venue.status}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {venue.courts.length} court · {venue.sportType}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-black">Booking cần xử lý</h2>
        <div className="mt-4 grid gap-3">
          {bookings.data
            ?.filter((item) => item.status === 'PENDING')
            .map((booking) => (
              <article
                key={booking.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-bold">
                    {booking.venueName} · {booking.courtName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {dateTime(booking.startAt)} → {dateTime(booking.endAt)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.guestName ?? 'Customer'} · {booking.contactPhone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => transition.mutate({ id: booking.id, action: 'reject' })}
                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => transition.mutate({ id: booking.id, action: 'confirm' })}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
                  >
                    Xác nhận
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
