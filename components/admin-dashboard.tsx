'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { AuthUser, VenueSummary } from '../lib/types';

type AdminVenue = VenueSummary & { status: string };
type AdminBooking = {
  id: string;
  venueName: string;
  courtName: string;
  contactPhone: string;
  startAt: string;
  endAt: string;
  status: string;
  totalAmount: number;
};

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ user: AuthUser }>('/auth/me'),
  });
  const venues = useQuery({
    queryKey: ['admin-venues'],
    queryFn: () => apiFetch<AdminVenue[]>('/admin/venues'),
    enabled: me.data?.user.role === 'ADMIN',
  });
  const bookings = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => apiFetch<AdminBooking[]>('/admin/bookings'),
    enabled: me.data?.user.role === 'ADMIN',
  });
  const review = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiFetch(`/admin/venues/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
    },
  });

  if (me.isLoading)
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">Đang tải…</div>;
  if (me.isError || me.data?.user.role !== 'ADMIN')
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black">Admin dashboard</h1>
        <p className="mt-3 text-slate-500">Khu vực này dành cho tài khoản ADMIN.</p>
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Operations</p>
      <h1 className="mt-2 text-4xl font-black">Quản trị CourtHub</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Venue" value={venues.data?.length ?? 0} />
        <Metric label="Booking" value={bookings.data?.length ?? 0} />
        <Metric
          label="Chờ duyệt"
          value={venues.data?.filter((item) => item.status === 'PENDING').length ?? 0}
        />
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-black">Venue chờ duyệt</h2>
        <div className="mt-4 grid gap-3">
          {venues.data
            ?.filter((item) => item.status === 'PENDING')
            .map((venue) => (
              <article
                key={venue.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-bold">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {venue.sportType} · {venue.address}, {venue.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => review.mutate({ id: venue.id, action: 'reject' })}
                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => review.mutate({ id: venue.id, action: 'approve' })}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
                  >
                    Duyệt
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-black">Booking gần đây</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Venue / Court</th>
                <th className="px-5 py-4">Số điện thoại</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {bookings.data?.slice(0, 20).map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100">
                  <td className="px-5 py-4 font-semibold">
                    {booking.venueName} · {booking.courtName}
                  </td>
                  <td className="px-5 py-4">{booking.contactPhone}</td>
                  <td className="px-5 py-4">{booking.status}</td>
                  <td className="px-5 py-4">{booking.totalAmount.toLocaleString('vi-VN')}đ</td>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
