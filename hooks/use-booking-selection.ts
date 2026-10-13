'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getVietnamDateKey,
  loadVenueBookingState,
  updateVenueBookingDate,
  updateVenueBookingSelection,
} from '../lib/booking-selection-storage';
import type { BookingSelection } from '../lib/booking-selection-storage';

export function useBookingSelection(venueId: string, initialDate: string) {
  const [date, setDate] = useState(initialDate);
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [isReady, setIsReady] = useState(false);
  const restoredVenueRef = useRef<string | null>(null);
  const currentDateRef = useRef(initialDate);

  useEffect(() => {
    if (!venueId) return;

    const stored = loadVenueBookingState(venueId);
    const storedDate = stored?.selectedDate;
    const restoredDate = storedDate && storedDate >= initialDate ? storedDate : initialDate;
    const restoredSelection =
      stored?.selection && getVietnamDateKey(stored.selection.startAt) === restoredDate
        ? stored.selection
        : null;

    // Hydrate browser-only localStorage state after SSR has completed.
    currentDateRef.current = restoredDate;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(restoredDate);
    setSelection(restoredSelection);
    restoredVenueRef.current = venueId;
    setIsReady(true);
  }, [venueId, initialDate]);

  const selectDate = useCallback(
    (nextDate: string) => {
      currentDateRef.current = nextDate;
      setDate(nextDate);

      const stored = loadVenueBookingState(venueId);
      const nextSelection =
        stored?.selection && getVietnamDateKey(stored.selection.startAt) === nextDate
          ? stored.selection
          : null;
      setSelection(nextSelection);

      if (restoredVenueRef.current === venueId) {
        updateVenueBookingDate(venueId, nextDate);
      }
    },
    [venueId],
  );

  const updateSelection = useCallback(
    (nextSelection: BookingSelection | null) => {
      const selectedDate = currentDateRef.current;
      setSelection(nextSelection);

      if (restoredVenueRef.current === venueId) {
        updateVenueBookingSelection(venueId, selectedDate, nextSelection);
      }
    },
    [venueId],
  );

  return {
    date,
    selection,
    isReady,
    selectDate,
    updateSelection,
  };
}
