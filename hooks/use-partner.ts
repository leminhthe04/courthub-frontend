import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '../lib/services';
import type { CreateCourtDto, CreateVenueDto, UpdateCourtDto } from '../lib/types';

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

export interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useCreatePartnerVenue(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateVenueDto) => partnerService.createVenue(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useCreatePartnerCourt(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { venueId: string; dto: CreateCourtDto }) =>
      partnerService.createCourt(params.venueId, params.dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useUpdatePartnerCourt(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { courtId: string; dto: UpdateCourtDto }) =>
      partnerService.updateCourt(params.courtId, params.dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useTransitionBooking(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; action: 'confirm' | 'reject' }) =>
      partnerService.transitionBooking(params.id, params.action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.bookings });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useCreatePricingRule(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      venueId: string;
      dto: import('../lib/types').CreateVenuePricingRuleDto;
    }) => partnerService.createPricingRule(params.venueId, params.dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      void queryClient.invalidateQueries({ queryKey: ['venue'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useDeletePricingRule(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { venueId: string; ruleId: string }) =>
      partnerService.deletePricingRule(params.venueId, params.ruleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      void queryClient.invalidateQueries({ queryKey: ['venue'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useSetPricingRules(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      venueId: string;
      rules: import('../lib/types').CreateVenuePricingRuleDto[];
    }) => partnerService.setPricingRules(params.venueId, params.rules),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      void queryClient.invalidateQueries({ queryKey: ['venue'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}
