'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
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

  useEffect(() => {
    if (!venueId) return;

    const stored = loadVenueBookingState(venueId);
    const storedDate = stored?.selectedDate;
    const restoredDate = storedDate && storedDate >= initialDate ? storedDate : initialDate;

    // Hydrate browser-only localStorage state after SSR has completed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(restoredDate);
    setSelection(stored?.selectionsByDate[restoredDate] ?? null);
    restoredVenueRef.current = venueId;
    setIsReady(true);
  }, [venueId, initialDate]);

  const selectDate = useCallback(
    (nextDate: string) => {
      setDate(nextDate);
      setSelection(loadVenueBookingState(venueId)?.selectionsByDate[nextDate] ?? null);

      if (restoredVenueRef.current === venueId) {
        updateVenueBookingDate(venueId, nextDate);
      }
    },
    [venueId],
  );

  const updateSelection = useCallback(
    (nextSelection: BookingSelection | null) => {
      setSelection(nextSelection);

      if (restoredVenueRef.current === venueId) {
        updateVenueBookingSelection(venueId, date, nextSelection);
      }
    },
    [date, venueId],
  );

  return {
    date,
    selection,
    isReady,
    selectDate,
    updateSelection,
  };
}
