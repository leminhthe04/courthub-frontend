'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { apiFetch, ApiError } from '../lib/api';
import type { AuthUser, BookingResult, ScheduleResponse, VenueDetail } from '../lib/types';
import { ScheduleGrid } from './schedule-grid';

function todayVietnam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function VenueBooking({ venueId }: { venueId: string }) {
  const queryClient = useQueryClient();
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

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ user: AuthUser }>('/auth/me'),
  });
  const venue = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => apiFetch<VenueDetail>(`/venues/${venueId}`),
  });
  const schedule = useQuery({
    queryKey: ['schedule', venueId, date],
    queryFn: () => apiFetch<ScheduleResponse>(`/venues/${venueId}/schedule?date=${date}`),
    enabled: Boolean(venue.data),
  });
  const currentUser = me.data?.user;
  const selectedCourt = useMemo(
    () => schedule.data?.courts.find((court) => court.id === selection?.courtId),
    [schedule.data, selection],
  );
  const total =
    selectedCourt && selection ? (selectedCourt.hourlyRate * selection.durationMinutes) / 60 : 0;
  const createBooking = useMutation({
    mutationFn: () => {
      if (!selection) throw new Error('Hãy chọn khoảng giờ trước');
      return apiFetch<BookingResult>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: selection.courtId,
          startAt: selection.startAt,
          endAt: selection.endAt,
          guestName: currentUser ? undefined : guestName,
          contactPhone: contactPhone || undefined,
          note: note || undefined,
        }),
      });
    },
    onSuccess: (result) => {
      setSuccess(result);
      setSelection(null);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['schedule', venueId, date] });
      if (result.guestToken && typeof window !== 'undefined') {
        window.localStorage.setItem(
          `courthub:guest-booking:${result.booking.id}`,
          result.guestToken,
        );
      }
    },
  });

  if (venue.isLoading)
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">Đang tải venue…</div>;
  if (venue.isError || !venue.data)
    return <div className="mx-auto max-w-7xl px-5 py-16 text-rose-700">Không tìm thấy venue.</div>;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <Link href="/" className="text-sm font-bold text-emerald-600">
        ← Quay lại tìm sân
      </Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {venue.data.sportType}
                </span>
                <h1 className="mt-4 text-4xl font-black tracking-tight">{venue.data.name}</h1>
                <p className="mt-3 text-slate-300">
                  {venue.data.address}, {venue.data.city}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 text-right text-sm text-slate-300">
                <strong className="block text-2xl text-white">{venue.data.courts.length}</strong>{' '}
                sân đang hoạt động
              </div>
            </div>
            <p className="mt-8 max-w-2xl leading-7 text-slate-300">
              {venue.data.description ?? 'Chọn ngày và kéo trên lịch để đặt sân.'}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
                Lịch sân
              </p>
              <h2 className="mt-1 text-2xl font-black">Chọn khoảng thời gian</h2>
            </div>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-600">
              Ngày{' '}
              <input
                type="date"
                value={date}
                min={todayVietnam()}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSelection(null);
                  setSuccess(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-normal outline-none focus:border-emerald-500"
              />
            </label>
          </div>
          <div className="mt-5">
            {schedule.isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
                Đang tải lịch…
              </div>
            )}
            {schedule.isError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                Không tải được lịch sân. Vui lòng thử lại.
              </div>
            )}
            {schedule.data && <ScheduleGrid schedule={schedule.data} onSelect={setSelection} />}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          {success ? (
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
                ✓
              </div>
              <h2 className="mt-4 text-2xl font-black">Đặt sân thành công</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mã booking: <strong>{success.booking.id.slice(0, 8).toUpperCase()}</strong>. Trạng
                thái hiện tại là <strong>{success.booking.status}</strong>; partner sẽ xác nhận sau.
              </p>
              {success.guestToken && (
                <p className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                  Bạn đang đặt với tư cách guest. Lưu mã booking và token trên thiết bị này để quản
                  lý booking; đăng nhập sẽ giúp bạn lưu lịch sử tự động.
                </p>
              )}
              <button
                onClick={() => setSuccess(null)}
                className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white"
              >
                Đặt thêm khung giờ
              </button>
            </div>
          ) : selection && selectedCourt ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                createBooking.mutate();
              }}
            >
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">
                Xác nhận
              </p>
              <h2 className="mt-2 text-2xl font-black">{selectedCourt.name}</h2>
              <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>{formatDateTime(selection.startAt)}</p>
                <p>đến {formatDateTime(selection.endAt)}</p>
                <p>{selection.durationMinutes} phút</p>
                <p className="pt-2 text-lg font-black text-slate-950">
                  {total.toLocaleString('vi-VN')}đ
                </p>
              </div>
              {!currentUser && (
                <>
                  <p className="mt-5 text-sm leading-6 text-slate-600">
                    Bạn có thể đặt không cần tài khoản. Vui lòng nhập thông tin liên hệ.
                  </p>
                  <input
                    required
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Tên người đặt"
                    className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </>
              )}
              <input
                required={!currentUser?.phone && !contactPhone}
                value={contactPhone || currentUser?.phone || ''}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="Số điện thoại"
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ghi chú (không bắt buộc)"
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
              {!currentUser && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="font-bold text-emerald-600">
                    Đăng nhập để lưu lịch sử booking.
                  </Link>
                </p>
              )}
              {createBooking.isError && (
                <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                  {createBooking.error instanceof ApiError
                    ? createBooking.error.message
                    : 'Không thể tạo booking.'}
                </p>
              )}
              <button
                disabled={createBooking.isPending}
                className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-white hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
              >
                {createBooking.isPending ? 'Đang đặt…' : 'Xác nhận đặt sân'}
              </button>
            </form>
          ) : (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">
                Bắt đầu đặt sân
              </p>
              <h2 className="mt-2 text-2xl font-black">Chọn một vùng trống</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Kéo chuột trên một hàng sân để chọn từ 30 phút trở lên. Bạn không cần đăng nhập để
                đặt.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
