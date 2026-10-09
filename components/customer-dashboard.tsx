'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../lib/api';
import type { AuthUser, CustomerBooking } from '../lib/types';

function dateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function CustomerDashboard() {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ user: AuthUser }>('/auth/me'),
  });
  const bookings = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => apiFetch<CustomerBooking[]>('/bookings/me'),
    enabled: Boolean(me.data?.user),
  });
  const cancel = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });

  if (me.isLoading)
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">Đang tải tài khoản…</div>;
  if (me.isError || !me.data?.user)
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-3xl font-black">Lịch sử booking</h1>
        <p className="mt-3 text-slate-500">
          Đăng nhập để xem các booking đã lưu. Bạn vẫn có thể đặt sân không cần tài khoản.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Customer</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">
        Lịch đặt sân của {me.data.user.fullName}
      </h1>
      <p className="mt-3 text-slate-500">Theo dõi trạng thái booking và lịch chơi của bạn.</p>
      {bookings.isError && (
        <p className="mt-8 rounded-xl bg-rose-50 p-4 text-rose-700">
          {bookings.error instanceof ApiError ? bookings.error.message : 'Không tải được lịch sử'}
        </p>
      )}
      {bookings.isLoading && <p className="mt-8 text-slate-500">Đang tải…</p>}
      {!bookings.isLoading && bookings.data?.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">Bạn chưa có booking nào.</p>
          <Link href="/" className="mt-4 inline-flex font-bold text-emerald-600">
            Tìm sân ngay →
          </Link>
        </div>
      )}
      <div className="mt-8 grid gap-4">
        {bookings.data?.map((booking) => (
          <article
            key={booking.id}
            className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold">
                  {booking.venueName} · {booking.courtName}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
                >
                  {booking.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {dateTime(booking.startAt)} → {dateTime(booking.endAt)}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {booking.totalAmount.toLocaleString('vi-VN')}đ
              </p>
            </div>
            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <button
                onClick={() => cancel.mutate(booking.id)}
                disabled={cancel.isPending}
                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
              >
                Hủy booking
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
