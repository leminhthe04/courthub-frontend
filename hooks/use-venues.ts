import { useQuery } from '@tanstack/react-query';
import { venuesService } from '../lib/services';
import type { VenueFilterDto } from '../lib/types';

export const VENUE_KEYS = {
  all: ['venues'] as const,
  list: (filter: VenueFilterDto) => ['venues', filter] as const,
  detail: (id: string) => ['venue', id] as const,
  schedule: (venueId: string, date: string) => ['schedule', venueId, date] as const,
};

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

export function useVenueSchedule(venueId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: VENUE_KEYS.schedule(venueId, date),
    queryFn: () => venuesService.getSchedule(venueId, date),
    enabled,
  });
}
