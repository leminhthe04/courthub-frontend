'use client';

import { useMemo, useState } from 'react';
import type { ScheduleResponse } from '../lib/types';

type Slot = { label: string; startMinutes: number; endMinutes: number };
type DragState = { courtId: string; startIndex: number; endIndex: number };

function toMinutes(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export function ScheduleGrid({
  schedule,
  onSelect,
}: {
  schedule: ScheduleResponse;
  onSelect: (selection: {
    courtId: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
  }) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [warning, setWarning] = useState('');
  const startMinutes = toMinutes(schedule.hours?.openTime, 6 * 60);
  const endMinutes = toMinutes(schedule.hours?.closeTime, 23 * 60);
  const slots = useMemo<Slot[]>(() => {
    const result: Slot[] = [];
    for (let cursor = startMinutes; cursor < endMinutes; cursor += 30) {
      result.push({ label: formatTime(cursor), startMinutes: cursor, endMinutes: cursor + 30 });
    }
    return result;
  }, [startMinutes, endMinutes]);

  const isBooked = (courtId: string, slot: Slot) => {
    const court = schedule.courts.find((item) => item.id === courtId);
    if (!court) return false;
    const slotStart = new Date(toIso(schedule.date, formatTime(slot.startMinutes))).getTime();
    const slotEnd = new Date(toIso(schedule.date, formatTime(slot.endMinutes))).getTime();
    return court.bookings.some(
      (booking) =>
        new Date(booking.startAt).getTime() < slotEnd &&
        new Date(booking.endAt).getTime() > slotStart,
    );
  };

  const completeSelection = () => {
    if (!drag) return;
    const first = Math.min(drag.startIndex, drag.endIndex);
    const last = Math.max(drag.startIndex, drag.endIndex);
    const selectedSlots = slots.slice(first, last + 1);
    const blocked = selectedSlots.some((slot) => isBooked(drag.courtId, slot));
    setDrag(null);
    if (blocked) {
      setWarning('Khoảng bạn chọn đã có slot được đặt. Hãy chọn vùng trống khác.');
      return;
    }
    setWarning('');
    const start = selectedSlots[0];
    const end = selectedSlots[selectedSlots.length - 1];
    onSelect({
      courtId: drag.courtId,
      startAt: toIso(schedule.date, formatTime(start.startMinutes)),
      endAt: toIso(schedule.date, formatTime(end.endMinutes)),
      durationMinutes: selectedSlots.length * 30,
    });
  };

  if (schedule.hours?.isClosed) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Venue đóng cửa vào ngày này.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" /> Có thể đặt
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-slate-300" /> Đã có người đặt
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-blue-500" /> Lựa chọn của bạn
        </span>
      </div>
      {warning && (
        <p className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {warning}
        </p>
      )}
      <div
        className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
        onPointerUp={completeSelection}
      >
        <div
          className="min-w-max"
          style={{
            display: 'grid',
            gridTemplateColumns: `180px repeat(${slots.length}, minmax(64px, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            Sân
          </div>
          {slots.map((slot) => (
            <div
              key={slot.label}
              className="border-b border-slate-200 px-2 py-4 text-center text-xs font-bold text-slate-500"
            >
              {slot.label}
            </div>
          ))}
          {schedule.courts.map((court) => (
            <div key={court.id} className="contents">
              <div className="sticky left-0 z-10 flex min-h-16 items-center border-b border-r border-slate-200 bg-white px-4">
                <div>
                  <p className="font-bold text-slate-900">{court.name}</p>
                  <p className="text-xs text-slate-500">
                    {court.hourlyRate.toLocaleString('vi-VN')}đ/giờ
                  </p>
                </div>
              </div>
              {slots.map((slot, index) => {
                const booked = isBooked(court.id, slot);
                const selected =
                  drag?.courtId === court.id &&
                  index >= Math.min(drag.startIndex, drag.endIndex) &&
                  index <= Math.max(drag.startIndex, drag.endIndex);
                return (
                  <button
                    key={`${court.id}-${slot.label}`}
                    type="button"
                    aria-label={`${court.name} ${slot.label}`}
                    disabled={booked}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      if (!booked)
                        setDrag({ courtId: court.id, startIndex: index, endIndex: index });
                    }}
                    onPointerEnter={() => {
                      if (drag?.courtId === court.id && !booked)
                        setDrag({ ...drag, endIndex: index });
                    }}
                    className={`min-h-16 border-b border-r border-slate-100 transition ${booked ? 'cursor-not-allowed bg-slate-300' : selected ? 'bg-blue-500' : 'bg-emerald-50 hover:bg-emerald-200'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Giữ chuột và kéo ngang trên một hàng sân để chọn khoảng thời gian liên tục. Mỗi ô tương ứng
        30 phút.
      </p>
    </div>
  );
}
