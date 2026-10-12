import { ApiError } from './http';

export function formatCurrency(amount: number, locale = 'vi'): string {
  const formattedNumber = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(amount);

  return locale === 'vi' ? `${formattedNumber}đ` : `${formattedNumber} VND`;
}

export function formatDateTime(value: string | Date, locale = 'vi'): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function formatDate(value: string | Date, locale = 'vi'): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    dateStyle: 'medium',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function formatSlotSummary(
  startAt: string | Date,
  endAt: string | Date,
  durationMinutes: number,
  minuteUnit: string = 'min',
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const dateStr = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(start);

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const startTime = timeFormatter.format(start);
  const endTime = timeFormatter.format(end);

  return `${startTime}-${endTime} -- ${dateStr} -- ${durationMinutes} ${minuteUnit}`;
}

export function calculateBookingPrice(
  startAt: string,
  endAt: string,
  pricingRules?: import('./types').VenuePricingRule[],
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

export function dayOfWeekForDate(date: string): import('./types').DayOfWeek {
  const [year, month, day] = date.split('-').map(Number);
  const values: import('./types').DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return values[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()];
}

export function pricingRulesForDate(date: string, rules?: import('./types').VenuePricingRule[]) {
  const day = dayOfWeekForDate(date);
  return (rules ?? []).filter((rule) => rule.dayOfWeek === day);
}

export function getLocalizedErrorMessage(
  error: unknown,
  tErrors: ((code: string) => string) & { has?: (code: string) => boolean },
): string {
  if (error instanceof ApiError && error.code) {
    if (tErrors.has && !tErrors.has(error.code)) {
      return error.message || tErrors('default');
    }
    try {
      const translated = tErrors(error.code);
      if (translated && !translated.startsWith('errors.')) {
        return translated;
      }
    } catch {
      // Fallback below
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return tErrors('default');
}
