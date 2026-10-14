import { formatWeekday } from './formatters';

export type BookingDateFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export type BookingWithStart = { startAt: string };

export type BookingGroup<T> = {
  date: string;
  label: string;
  items: T[];
};

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function todayVietnam(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: VIETNAM_TIME_ZONE }).format(new Date());
}

function dateFromKey(value: string): Date {
  return new Date(`${value}T12:00:00+07:00`);
}

function addDays(value: string, amount: number): string {
  const date = dateFromKey(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function dateRange(filter: BookingDateFilter, from: string, to: string): [string, string] | null {
  const today = todayVietnam();

  if (filter === 'ALL') return null;
  if (filter === 'TODAY') return [today, today];
  if (filter === 'CUSTOM') {
    return from && to && from <= to ? [from, to] : ['', ''];
  }

  const current = dateFromKey(today);
  const day = current.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(today, mondayOffset);

  if (filter === 'THIS_WEEK') return [monday, addDays(monday, 6)];
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  const lastOfMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
  return [firstOfMonth, lastOfMonth];
}

export function filterBookings<T extends BookingWithStart>(
  bookings: T[],
  filter: BookingDateFilter,
  from: string,
  to: string,
): T[] {
  const range = dateRange(filter, from, to);
  if (range?.[0] === '') return [];

  return bookings
    .filter((booking) => {
      if (!range) return true;
      const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: VIETNAM_TIME_ZONE,
      }).format(new Date(booking.startAt));
      return date >= range[0] && date <= range[1];
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function groupBookingsByDate<T extends BookingWithStart>(
  bookings: T[],
  locale: string,
): BookingGroup<T>[] {
  const groups = new Map<string, T[]>();

  for (const booking of bookings) {
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: VIETNAM_TIME_ZONE,
    }).format(new Date(booking.startAt));
    const items = groups.get(date) ?? [];
    items.push(booking);
    groups.set(date, items);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      label: `${formatWeekday(date, locale)} - ${new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: VIETNAM_TIME_ZONE,
      }).format(dateFromKey(date))}`,
      items,
    }));
}
