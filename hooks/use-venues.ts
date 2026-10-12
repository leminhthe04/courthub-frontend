import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { venuesService } from '../lib/services';
import type { VenueFilterDto } from '../lib/types';

export const VENUE_KEYS = {
  all: ['venues'] as const,
  list: (filter: VenueFilterDto) => ['venues', filter] as const,
  detail: (id: string) => ['venue', id] as const,
  schedule: (venueId: string, date: string) => ['schedule', venueId, date] as const,
};

function shiftDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export interface UseVenueScheduleOptions {
  enabled?: boolean;
  prefetchWindow?: number;
  minDate?: string;
  staleTime?: number;
}

export function useVenues(filter: VenueFilterDto) {
  return useQuery({
    queryKey: VENUE_KEYS.list(filter),
    queryFn: () => venuesService.listPublic(filter),
  });
}

export function useVenueDetail(venueId: string) {
  return useQuery({
    queryKey: VENUE_KEYS.detail(venueId),
    queryFn: () => venuesService.getPublic(venueId),
  });
}

export function useVenueSchedule(
  venueId: string,
  date: string,
  enabledOrOptions: boolean | UseVenueScheduleOptions = true,
) {
  const options: UseVenueScheduleOptions =
    typeof enabledOrOptions === 'boolean' ? { enabled: enabledOrOptions } : enabledOrOptions;

  const { enabled = true, prefetchWindow = 3, minDate, staleTime = 120_000 } = options;

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: VENUE_KEYS.schedule(venueId, date),
    queryFn: () => venuesService.getSchedule(venueId, date),
    enabled: Boolean(venueId) && Boolean(date) && enabled,
    staleTime,
    gcTime: 10 * 60_000,
  });

  // Pre-load sliding window of +/- prefetchWindow days around current date
  useEffect(() => {
    if (!enabled || !venueId || !date) return;

    for (let offset = -prefetchWindow; offset <= prefetchWindow; offset++) {
      if (offset === 0) continue;
      const targetDate = shiftDateString(date, offset);
      if (minDate && targetDate < minDate) continue;

      void queryClient.prefetchQuery({
        queryKey: VENUE_KEYS.schedule(venueId, targetDate),
        queryFn: () => venuesService.getSchedule(venueId, targetDate),
        staleTime,
      });
    }
  }, [venueId, date, enabled, prefetchWindow, minDate, staleTime, queryClient]);

  return query;
}
