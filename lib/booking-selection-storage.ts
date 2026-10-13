export type BookingSelection = {
  courtId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
};

export type PersistedVenueBookingState = {
  version: 2;
  selectedDate: string;
  selection: BookingSelection | null;
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
    version: 2,
    selectedDate,
    selection: null,
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

    const state = parsed as Partial<PersistedVenueBookingState> & {
      selectionsByDate?: Record<string, unknown>;
    };
    if (!isDateKey(state.selectedDate)) return null;

    if (state.version === 2) {
      return {
        version: 2,
        selectedDate: state.selectedDate,
        selection:
          state.selection === null || isBookingSelection(state.selection) ? state.selection : null,
      };
    }

    // Migrate the previous per-date shape by keeping only the selection for
    // the last viewed date. It is rewritten in the new shape on the next save.
    if (state.version === 1) {
      const legacySelection = state.selectionsByDate?.[state.selectedDate];
      return {
        version: 2,
        selectedDate: state.selectedDate,
        selection: isBookingSelection(legacySelection) ? legacySelection : null,
      };
    }

    return null;
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
  saveVenueBookingState(venueId, {
    version: 2,
    selectedDate,
    selection,
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
