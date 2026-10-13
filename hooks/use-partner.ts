import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '../lib/services';
import type {
  Court,
  CreateCourtDto,
  CreateVenueDto,
  ScheduleResponse,
  UpdateCourtDto,
  VenueDetail,
} from '../lib/types';

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

type ScheduleCache = ScheduleResponse | undefined;

function updateCourtCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  venueId: string,
  courtId: string,
  update: (court: Court) => Court | null,
) {
  queryClient.setQueryData<VenueDetail[]>(PARTNER_KEYS.venues, (venues) =>
    venues?.map((venue) =>
      venue.id !== venueId
        ? venue
        : {
            ...venue,
            courts: venue.courts
              .map((court) => update(court))
              .filter((court): court is Court => court !== null),
          },
    ),
  );

  queryClient.setQueriesData<ScheduleCache>({ queryKey: ['schedule', venueId] }, (schedule) => {
    if (!schedule) return schedule;
    const updatedVenueCourts = schedule.venue.courts
      .map((court) => (court.id === courtId ? update(court) : court))
      .filter((court): court is Court => court !== null);
    const updatedVenueCourt = updatedVenueCourts.find((court) => court.id === courtId);
    const updatedScheduleCourts = schedule.courts
      .map((court) => {
        if (court.id !== courtId) return court;
        const updatedCourt = update(court);
        return updatedCourt ? { ...court, ...updatedCourt } : null;
      })
      .filter((court): court is ScheduleResponse['courts'][number] => court !== null);

    if (
      updatedVenueCourt?.isActive &&
      !updatedScheduleCourts.some((court) => court.id === courtId)
    ) {
      updatedScheduleCourts.push({ ...updatedVenueCourt, bookings: [] });
    }

    return {
      ...schedule,
      venue: { ...schedule.venue, courts: updatedVenueCourts },
      courts: updatedScheduleCourts,
    };
  });
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
    onSuccess: (createdCourt, params) => {
      queryClient.setQueryData<VenueDetail[]>(PARTNER_KEYS.venues, (venues) =>
        venues?.map((venue) =>
          venue.id !== params.venueId
            ? venue
            : {
                ...venue,
                courts: [...venue.courts, createdCourt].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              },
        ),
      );
      queryClient.setQueriesData<ScheduleCache>(
        { queryKey: ['schedule', params.venueId] },
        (schedule) => {
          if (!schedule || !createdCourt.isActive) return schedule;
          return {
            ...schedule,
            venue: {
              ...schedule.venue,
              courts: [...schedule.venue.courts, createdCourt].sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            },
            courts: [...schedule.courts, { ...createdCourt, bookings: [] }].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      void queryClient.invalidateQueries({ queryKey: ['schedule', params.venueId] });
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
    mutationFn: (params: { venueId: string; courtId: string; dto: UpdateCourtDto }) =>
      partnerService.updateCourt(params.courtId, params.dto),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: PARTNER_KEYS.venues });
      await queryClient.cancelQueries({ queryKey: ['schedule', params.venueId] });
      const previousVenues = queryClient.getQueryData<VenueDetail[]>(PARTNER_KEYS.venues);
      const previousSchedules = queryClient.getQueriesData<ScheduleCache>({
        queryKey: ['schedule', params.venueId],
      });
      updateCourtCaches(queryClient, params.venueId, params.courtId, (court) =>
        court.id === params.courtId ? { ...court, ...params.dto } : court,
      );
      return { previousVenues, previousSchedules };
    },
    onSuccess: (_updatedCourt, params) => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      void queryClient.invalidateQueries({ queryKey: ['schedule', params.venueId] });
      options?.onSuccess?.();
    },
    onError: (err, _params, context) => {
      if (context?.previousVenues) {
        queryClient.setQueryData(PARTNER_KEYS.venues, context.previousVenues);
      }
      context?.previousSchedules?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      options?.onError?.(err);
    },
  });
}

export function useDeletePartnerCourt(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { venueId: string; courtId: string }) =>
      partnerService.deleteCourt(params.courtId),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: PARTNER_KEYS.venues });
      await queryClient.cancelQueries({ queryKey: ['schedule', params.venueId] });
      const previousVenues = queryClient.getQueryData<VenueDetail[]>(PARTNER_KEYS.venues);
      const previousSchedules = queryClient.getQueriesData<ScheduleCache>({
        queryKey: ['schedule', params.venueId],
      });
      updateCourtCaches(queryClient, params.venueId, params.courtId, (court) =>
        court.id === params.courtId ? null : court,
      );
      return { previousVenues, previousSchedules };
    },
    onSuccess: (_deletedCourt, params) => {
      void queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.venues });
      void queryClient.invalidateQueries({ queryKey: ['schedule', params.venueId] });
      options?.onSuccess?.();
    },
    onError: (err, _params, context) => {
      if (context?.previousVenues) {
        queryClient.setQueryData(PARTNER_KEYS.venues, context.previousVenues);
      }
      context?.previousSchedules?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
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
