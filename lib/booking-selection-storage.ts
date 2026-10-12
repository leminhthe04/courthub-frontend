export type BookingSelection = {
  courtId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
};

export type PersistedVenueBookingState = {
  version: 1;
  selectedDate: string;
  selectionsByDate: Record<string, BookingSelection>;
};

const STORAGE_KEY_PREFIX = 'courthub:venue-booking:';

function getStorageKey(venueId: string) {
  return `${STORAGE_KEY_PREFIX}${venueId}`;
}

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isBookingSelection(value: unknown): value is BookingSelection {
  if (!value || typeof value !== 'object') return false;

  const selection = value as Partial<BookingSelection>;
  return (
    typeof selection.courtId === 'string' &&
    selection.courtId.length > 0 &&
    typeof selection.startAt === 'string' &&
    !Number.isNaN(new Date(selection.startAt).getTime()) &&
    typeof selection.endAt === 'string' &&
    !Number.isNaN(new Date(selection.endAt).getTime()) &&
    typeof selection.durationMinutes === 'number' &&
    Number.isInteger(selection.durationMinutes) &&
    selection.durationMinutes > 0
  );
}

function emptyState(selectedDate: string): PersistedVenueBookingState {
  return {
    version: 1,
    selectedDate,
    selectionsByDate: {},
  };
}

export function getVietnamDateKey(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
}

export function loadVenueBookingState(venueId: string): PersistedVenueBookingState | null {
  if (typeof window === 'undefined' || !venueId) return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(venueId));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const state = parsed as Partial<PersistedVenueBookingState>;
    if (state.version !== 1 || !isDateKey(state.selectedDate)) return null;

    const selectionsByDate: Record<string, BookingSelection> = {};
    if (state.selectionsByDate && typeof state.selectionsByDate === 'object') {
      for (const [date, selection] of Object.entries(state.selectionsByDate)) {
        if (isDateKey(date) && isBookingSelection(selection)) {
          selectionsByDate[date] = selection;
        }
      }
    }

    return {
      version: 1,
      selectedDate: state.selectedDate,
      selectionsByDate,
    };
  } catch {
    return null;
  }
}

export function saveVenueBookingState(venueId: string, state: PersistedVenueBookingState): void {
  if (typeof window === 'undefined' || !venueId) return;

  try {
    window.localStorage.setItem(getStorageKey(venueId), JSON.stringify(state));
  } catch {
    // localStorage can be unavailable in private browsing or when storage is full.
  }
}

export function updateVenueBookingSelection(
  venueId: string,
  selectedDate: string,
  selection: BookingSelection | null,
): void {
  const current = loadVenueBookingState(venueId) ?? emptyState(selectedDate);
  const selectionsByDate = { ...current.selectionsByDate };

  if (selection) {
    selectionsByDate[selectedDate] = selection;
  } else {
    delete selectionsByDate[selectedDate];
  }

  saveVenueBookingState(venueId, {
    version: 1,
    selectedDate,
    selectionsByDate,
  });
}

export function updateVenueBookingDate(venueId: string, selectedDate: string): void {
  const current = loadVenueBookingState(venueId) ?? emptyState(selectedDate);
  saveVenueBookingState(venueId, {
    ...current,
    selectedDate,
  });
}

export function clearVenueBookingSelection(venueId: string, selectedDate: string): void {
  updateVenueBookingSelection(venueId, selectedDate, null);
}
