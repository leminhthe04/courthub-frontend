import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../lib/services';
import type { CreateBookingDto } from '../lib/types';

export const BOOKING_KEYS = {
  myBookings: ['my-bookings'] as const,
};

export function useMyBookings(enabled = true) {
  return useQuery({
    queryKey: BOOKING_KEYS.myBookings,
    queryFn: () => bookingsService.listMine(),
    enabled,
  });
}

export function useCreateBooking(options?: {
  onSuccess?: (result: Awaited<ReturnType<typeof bookingsService.create>>) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBookingDto) => bookingsService.create(dto),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.myBookings });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      options?.onSuccess?.(result);
    },
    onError: options?.onError,
  });
}
