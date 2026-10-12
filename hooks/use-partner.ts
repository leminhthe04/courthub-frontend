import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '../lib/services';
import type { CreateCourtDto, CreateVenueDto } from '../lib/types';

export const PARTNER_KEYS = {
  venues: ['partner-venues'] as const,
  bookings: ['partner-bookings'] as const,
};

export function usePartnerVenues(enabled = true) {
  return useQuery({
    queryKey: PARTNER_KEYS.venues,
    queryFn: () => partnerService.listVenues(),
    enabled,
  });
}

export function usePartnerBookings(enabled = true) {
  return useQuery({
    queryKey: PARTNER_KEYS.bookings,
    queryFn: () => partnerService.listBookings(),
    enabled,
  });
}

export function useCreatePartnerVenue(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateVenueDto) => partnerService.createVenue(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      options?.onSuccess?.();
    },
  });
}

export function useCreatePartnerCourt(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { venueId: string; dto: CreateCourtDto }) =>
      partnerService.createCourt(params.venueId, params.dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      options?.onSuccess?.();
    },
  });
}

export function useTransitionBooking(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; action: 'confirm' | 'reject' }) =>
      partnerService.transitionBooking(params.id, params.action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.bookings });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      options?.onSuccess?.();
    },
  });
}
