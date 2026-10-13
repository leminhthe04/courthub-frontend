'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VENUE_KEYS } from '../hooks/use-venues';
import { formatCurrency, pricingRulesForDate } from '../lib/formatters';
import { venuesService } from '../lib/services';
import type { ScheduleResponse } from '../lib/types';

type Slot = { label: string; startMinutes: number; endMinutes: number };
type DragState = { courtId: string; startIndex: number; endIndex: number };

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function clockToMinutes(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function toIso(date: string, minutes: number) {
  const [y, m, d] = date.split('-').map(Number);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // Vietnam is UTC+7
  const utcDate = new Date(Date.UTC(y, m - 1, d, hours - 7, mins, 0));
  return utcDate.toISOString();
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatWeekday(dateStr: string, locale: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    weekday: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}

export function ScheduleGrid({
  schedule,
  selectedRange,
  onSelect,
  readOnly = false,
  onDateChange,
  minDate,
}: {
  schedule: ScheduleResponse;
  selectedRange?: {
    courtId: string;
    startAt: string;
    endAt: string;
  } | null;
  onSelect?: (
    selection: {
      courtId: string;
      startAt: string;
      endAt: string;
      durationMinutes: number;
    } | null,
  ) => void;
  readOnly?: boolean;
  onDateChange?: (date: string) => void;
  minDate?: string;
}) {
  const locale = useLocale();
  const t = useTranslations('schedule');
  const queryClient = useQueryClient();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const [internalSelection, setInternalSelection] = useState<{
    courtId: string;
    startAt: string;
    endAt: string;
  } | null>(null);
  const [warning, setWarning] = useState('');

  // Reset internal selection when viewing another date
  const [prevDate, setPrevDate] = useState(schedule.date);
  if (prevDate !== schedule.date) {
    setPrevDate(schedule.date);
    setInternalSelection(null);
    setWarning('');
  }

  const activeSelection = selectedRange !== undefined ? selectedRange : internalSelection;

  // Expand gantt chart to cover full day from 00:00 to 23:59 (48 slots of 30 mins)
  const slots = useMemo<Slot[]>(() => {
    const result: Slot[] = [];
    for (let cursor = 0; cursor < 24 * 60; cursor += 30) {
      result.push({ label: formatTime(cursor), startMinutes: cursor, endMinutes: cursor + 30 });
    }
    return result;
  }, []);

  // Pre-calculate timestamp intervals for bookings to make grid rendering instant
  const courtBookingsMap = useMemo(() => {
    const map = new Map<string, { start: number; end: number }[]>();
    for (const court of schedule.courts) {
      map.set(
        court.id,
        court.bookings.map((b) => ({
          start: new Date(b.startAt).getTime(),
          end: new Date(b.endAt).getTime(),
        })),
      );
    }
    return map;
  }, [schedule.courts]);

  const slotTimes = useMemo(() => {
    return slots.map((slot) => ({
      slot,
      start: new Date(toIso(schedule.date, slot.startMinutes)).getTime(),
      end: new Date(toIso(schedule.date, slot.endMinutes)).getTime(),
    }));
  }, [schedule.date, slots]);

  const pricingIntervals = useMemo(
    () =>
      pricingRulesForDate(schedule.date, schedule.venue.pricingRules)
        .map((rule) => ({
          start: clockToMinutes(rule.startTime),
          end: clockToMinutes(rule.endTime),
        }))
        .filter((rule): rule is { start: number; end: number } => {
          return rule.start !== null && rule.end !== null && rule.end > rule.start;
        }),
    [schedule.date, schedule.venue.pricingRules],
  );

  // Default initial scroll to 06:00
  useEffect(() => {
    const scrollToSixAm = () => {
      if (scrollContainerRef.current) {
        const sixAmSlot =
          scrollContainerRef.current.querySelector<HTMLElement>('[data-slot="06:00"]');
        if (sixAmSlot) {
          // Sticky court column is 180px wide
          scrollContainerRef.current.scrollLeft = Math.max(0, sixAmSlot.offsetLeft - 370);
        }
      }
    };

    scrollToSixAm();
    const rafId = requestAnimationFrame(scrollToSixAm);
    return () => cancelAnimationFrame(rafId);
  }, [schedule.date]);

  const isBooked = useCallback(
    (courtId: string, slotIndex: number) => {
      const intervals = courtBookingsMap.get(courtId);
      if (!intervals || intervals.length === 0) return false;
      const { start, end } = slotTimes[slotIndex];
      return intervals.some((b) => b.start < end && b.end > start);
    },
    [courtBookingsMap, slotTimes],
  );

  const hasPricingRule = useCallback(
    (slotIndex: number) => {
      const slot = slotTimes[slotIndex]?.slot;
      if (!slot) return false;
      return pricingIntervals.some(
        (rule) => rule.start <= slot.startMinutes && slot.endMinutes <= rule.end,
      );
    },
    [pricingIntervals, slotTimes],
  );

  const isSlotSelectable = useCallback(
    (courtId: string, slotIndex: number) => {
      return !isBooked(courtId, slotIndex) && hasPricingRule(slotIndex);
    },
    [hasPricingRule, isBooked],
  );

  const getValidDragEndIndex = useCallback(
    (courtId: string, startIndex: number, targetIndex: number) => {
      if (startIndex === targetIndex) return startIndex;

      const direction = targetIndex > startIndex ? 1 : -1;
      let currentIndex = startIndex;

      while (currentIndex !== targetIndex) {
        const nextIndex = currentIndex + direction;
        if (!isSlotSelectable(courtId, nextIndex)) return currentIndex;
        currentIndex = nextIndex;
      }

      return currentIndex;
    },
    [isSlotSelectable],
  );

  const updateDragEnd = useCallback(
    (courtId: string, targetIndex: number) => {
      const currentDrag = dragRef.current;
      if (!currentDrag || currentDrag.courtId !== courtId) return;

      const endIndex = getValidDragEndIndex(courtId, currentDrag.startIndex, targetIndex);
      if (currentDrag.endIndex === endIndex) return;

      const nextDrag = { ...currentDrag, endIndex };
      dragRef.current = nextDrag;
      setDrag(nextDrag);
    },
    [getValidDragEndIndex],
  );

  const completeSelection = useCallback(() => {
    const currentDrag = dragRef.current;
    if (readOnly || !currentDrag) return;
    const boundedEndIndex = getValidDragEndIndex(
      currentDrag.courtId,
      currentDrag.startIndex,
      currentDrag.endIndex,
    );
    const first = Math.min(currentDrag.startIndex, boundedEndIndex);
    const last = Math.max(currentDrag.startIndex, boundedEndIndex);
    const selectedSlots = slots.slice(first, last + 1);
    const blocked = selectedSlots.some((_, idx) => isBooked(currentDrag.courtId, first + idx));
    setDrag(null);
    dragRef.current = null;
    if (blocked) {
      setWarning(
        locale === 'vi'
          ? 'Khoảng bạn chọn đã có ô được đặt. Hãy chọn vùng trống khác.'
          : 'Selected range contains already booked slots. Please choose available slots.',
      );
      return;
    }
    setWarning('');

    // Check if user clicked (without dragging) on an already selected slot to deselect
    const isSingleClick = currentDrag.startIndex === currentDrag.endIndex;
    if (isSingleClick && activeSelection && activeSelection.courtId === currentDrag.courtId) {
      const clickedSlotTime = slotTimes[currentDrag.startIndex];
      const selStart = new Date(activeSelection.startAt).getTime();
      const selEnd = new Date(activeSelection.endAt).getTime();
      const isInsideCurrentSelection =
        clickedSlotTime.start >= selStart && clickedSlotTime.end <= selEnd;

      if (isInsideCurrentSelection) {
        setInternalSelection(null);
        onSelect?.(null);
        return;
      }
    }

    const start = selectedSlots[0];
    const end = selectedSlots[selectedSlots.length - 1];
    const startAt = toIso(schedule.date, start.startMinutes);
    const endAt = toIso(schedule.date, end.endMinutes);
    const durationMinutes = selectedSlots.length * 30;

    const newSelection = {
      courtId: currentDrag.courtId,
      startAt,
      endAt,
      durationMinutes,
    };

    setInternalSelection(newSelection);
    onSelect?.(newSelection);
  }, [
    readOnly,
    slots,
    isBooked,
    getValidDragEndIndex,
    locale,
    schedule.date,
    activeSelection,
    slotTimes,
    onSelect,
  ]);

  const isDragging = Boolean(drag);

  // Global pointer move and up listeners to track drag smoothly across slots
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest<HTMLElement>('[data-slot-cell]');
      if (!cell) return;
      const courtId = cell.dataset.courtId;
      const slotIndexStr = cell.dataset.slotIndex;
      if (!courtId || slotIndexStr === undefined) return;
      const slotIndex = parseInt(slotIndexStr, 10);
      if (isNaN(slotIndex)) return;

      updateDragEnd(courtId, slotIndex);
    };

    const handleGlobalUp = () => {
      completeSelection();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('mouseup', handleGlobalUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDragging, completeSelection, updateDragEnd]);

  const prefetchDay = (offset: number) => {
    if (!schedule.venue?.id) return;
    const targetDate = shiftDate(schedule.date, offset);
    if (minDate && targetDate < minDate) return;
    void queryClient.prefetchQuery({
      queryKey: VENUE_KEYS.schedule(schedule.venue.id, targetDate),
      queryFn: () => venuesService.getSchedule(schedule.venue.id, targetDate),
      staleTime: 120_000,
    });
  };

  const handlePrevDay = () => {
    if (!onDateChange) return;
    const prev = shiftDate(schedule.date, -1);
    if (minDate && prev < minDate) return;
    onDateChange(prev);

    // Proactively prefetch remaining buffer backwards
    for (let offset = -2; offset >= -4; offset--) {
      prefetchDay(offset);
    }
  };

  const handleNextDay = () => {
    if (!onDateChange) return;
    const next = shiftDate(schedule.date, 1);
    onDateChange(next);

    // Proactively prefetch remaining buffer forwards
    for (let offset = 2; offset <= 4; offset++) {
      prefetchDay(offset);
    }
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate || !onDateChange) return;
    if (minDate && newDate < minDate) return;

    onDateChange(newDate);

    // Prefetch +/- 3 days around newly selected date immediately
    if (schedule.venue?.id) {
      for (let offset = -3; offset <= 3; offset++) {
        if (offset === 0) continue;
        const targetDate = shiftDate(newDate, offset);
        if (minDate && targetDate < minDate) continue;
        void queryClient.prefetchQuery({
          queryKey: VENUE_KEYS.schedule(schedule.venue.id, targetDate),
          queryFn: () => venuesService.getSchedule(schedule.venue.id, targetDate),
          staleTime: 120_000,
        });
      }
    }
  };

  const isPrevDisabled = !onDateChange || Boolean(minDate && schedule.date <= minDate);

  const renderDateToolbar = () => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      {/* Date Navigation Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePrevDay}
          onMouseEnter={() => prefetchDay(-1)}
          disabled={isPrevDisabled}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {'<'}
        </button>

        <div className="relative inline-flex h-9 w-[190px] shrink-0 items-center rounded-lg border border-slate-200 bg-white px-2.5 shadow-xs transition hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
          <span className="shrink-0">{formatWeekday(schedule.date, locale)}</span>

          <input
            ref={dateInputRef}
            type="date"
            value={schedule.date}
            min={minDate}
            disabled={!onDateChange}
            onChange={handleDateInput}
            aria-label={locale === 'vi' ? 'Chọn ngày xem lịch' : 'Select date'}
            className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          onMouseEnter={() => prefetchDay(1)}
          disabled={!onDateChange}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {'>'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 bg-emerald-100" /> {t('available')}
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 bg-amber-300" /> {t('booked')}
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 bg-slate-100" /> {t('unavailable')}
        </span>
        {!readOnly && (
          <span className="inline-flex items-center gap-2">
            <i className="h-3 w-3 bg-blue-500" /> {t('selected')}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {renderDateToolbar()}

      {warning && (
        <p className="mb-3 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{warning}</p>
      )}

      {schedule.venue.pricingRules && schedule.venue.pricingRules.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
          <span className="font-bold text-slate-700">
            {locale === 'vi' ? 'Bảng giá theo giờ:' : 'Hourly Pricing:'}
          </span>
          {pricingRulesForDate(schedule.date, schedule.venue.pricingRules).map((rule) => (
            <span
              key={rule.id}
              className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium text-slate-800 shadow-xs border border-slate-200"
            >
              <span className="font-bold text-emerald-700">
                {rule.startTime.slice(0, 5)} - {rule.endTime.slice(0, 5)}:
              </span>
              <span>{formatCurrency(rule.hourlyRate, locale)}/h</span>
            </span>
          ))}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto border border-slate-200 bg-white shadow-sm select-none"
      >
        <div
          className="min-w-max"
          style={{
            display: 'grid',
            gridTemplateColumns: `180px 20px repeat(${slots.length}, minmax(64px, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            {locale === 'vi' ? 'Sân' : 'Court'}
          </div>
          <div aria-hidden="true" className="border-b border-slate-200 bg-white" />
          {slots.map((slot, index) => (
            <div
              key={slot.label}
              data-slot={slot.label}
              className="relative h-12 border-b border-slate-200 text-xs font-bold text-slate-500"
            >
              <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
                {slot.label}
              </span>
              {index === slots.length - 1 && (
                <span className="absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
                  24:00
                </span>
              )}
            </div>
          ))}
          {schedule.courts.map((court) => (
            <div key={court.id} className="contents">
              <div className="sticky left-0 z-10 flex min-h-16 items-center border-b border-r border-slate-200 bg-white px-4">
                <div>
                  <p className="font-bold text-slate-900">{court.name}</p>
                </div>
              </div>
              <div aria-hidden="true" className="border-b border-slate-100 bg-white" />
              {slots.map((slot, index) => {
                const booked = isBooked(court.id, index);
                const unpriced = !hasPricingRule(index);

                const isBeingDragged =
                  !readOnly &&
                  drag?.courtId === court.id &&
                  index >= Math.min(drag.startIndex, drag.endIndex) &&
                  index <= Math.max(drag.startIndex, drag.endIndex);

                const isConfirmedSelected =
                  !readOnly &&
                  Boolean(
                    activeSelection &&
                    activeSelection.courtId === court.id &&
                    slotTimes[index].start >= new Date(activeSelection.startAt).getTime() &&
                    slotTimes[index].end <= new Date(activeSelection.endAt).getTime(),
                  );

                const isSelected = drag ? isBeingDragged : isConfirmedSelected;

                return (
                  <button
                    key={`${court.id}-${slot.label}`}
                    type="button"
                    data-slot-cell="true"
                    data-court-id={court.id}
                    data-slot-index={index}
                    aria-label={`${court.name} ${slot.label}`}
                    title={
                      booked
                        ? `${court.name} - ${slot.label}: ${t('booked')}`
                        : unpriced
                          ? `${court.name} - ${slot.label}: ${t('noPricingRule')}`
                          : isSelected
                            ? `${court.name} - ${slot.label}: ${t('selected')} (${locale === 'vi' ? 'Nhấn để bỏ chọn' : 'Click to deselect'})`
                            : `${court.name} - ${slot.label}: ${t('available')}`
                    }
                    disabled={readOnly || booked || unpriced}
                    onPointerDown={
                      readOnly
                        ? undefined
                        : (event) => {
                            if (!booked && !unpriced && event.button === 0) {
                              event.preventDefault();
                              try {
                                (event.currentTarget as HTMLElement).releasePointerCapture(
                                  event.pointerId,
                                );
                              } catch {}
                              const newDrag = {
                                courtId: court.id,
                                startIndex: index,
                                endIndex: index,
                              };
                              dragRef.current = newDrag;
                              setDrag(newDrag);
                            }
                          }
                    }
                    onPointerEnter={
                      readOnly
                        ? undefined
                        : () => {
                            if (dragRef.current?.courtId === court.id) {
                              updateDragEnd(court.id, index);
                            }
                          }
                    }
                    className={`min-h-16 border-b border-r border-slate-100 transition select-none ${
                      unpriced
                        ? 'bg-slate-100'
                        : booked
                          ? 'bg-amber-300'
                          : isSelected
                            ? 'bg-blue-500 cursor-pointer shadow-inner'
                            : readOnly
                              ? 'cursor-default bg-emerald-50/70'
                              : 'cursor-pointer bg-emerald-50 hover:bg-emerald-200'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
