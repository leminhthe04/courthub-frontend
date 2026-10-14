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

export function formatTimeRange(startAt: string | Date, endAt: string | Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

export function formatSlotSummary(
  startAt: string | Date,
  endAt: string | Date,
  durationMinutes: number | null,
  minuteUnit: string | null,
  locale?: string,
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

  const timeRange = `${startTime}-${endTime}`;
  const weekday = locale ? `${formatWeekday(start, locale)}-` : '';
  const duration =
    durationMinutes !== null && minuteUnit !== null ? ` -- ${durationMinutes} ${minuteUnit}` : '';

  return `${timeRange} -- ${weekday}${dateStr}${duration}`;
}

export function formatWeekday(value: string | Date, locale = 'vi'): string {
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00+07:00`)
      : new Date(value);

  if (locale !== 'vi') {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }

  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
  const shortNames: Record<string, string> = {
    Sun: 'Chủ nhật',
    Mon: 'Thứ 2',
    Tue: 'Thứ 3',
    Wed: 'Thứ 4',
    Thu: 'Thứ 5',
    Fri: 'Thứ 6',
    Sat: 'Thứ 7',
  };

  return shortNames[day] ?? day;
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
    const details = error.details as { message?: unknown } | undefined;
    const validationMessages = Array.isArray(details?.message)
      ? details.message.filter((message): message is string => typeof message === 'string')
      : [];

    if (error.code === 'HTTP_400' && validationMessages.length > 0) {
      if (
        validationMessages.some((message) =>
          message.toLowerCase().includes('contactphone must be a valid phone number'),
        )
      ) {
        try {
          const translated = tErrors('BOOKING_INVALID_CONTACT_PHONE');
          if (translated && !translated.startsWith('errors.')) return translated;
        } catch {
          // Fall through to the server validation message.
        }
      }

      return validationMessages.join(', ');
    }

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
