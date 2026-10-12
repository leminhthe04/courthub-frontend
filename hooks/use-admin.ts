import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../lib/services';

export const ADMIN_KEYS = {
  venues: ['admin-venues'] as const,
  bookings: ['admin-bookings'] as const,
};

export function useAdminVenues(enabled = true) {
  return useQuery({
    queryKey: ADMIN_KEYS.venues,
    queryFn: () => adminService.listVenues(),
    enabled,
  });
}

export function useAdminBookings(enabled = true) {
  return useQuery({
    queryKey: ADMIN_KEYS.bookings,
    queryFn: () => adminService.listBookings(),
    enabled,
  });
}

export function useReviewVenue(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; action: 'approve' | 'reject' }) =>
      adminService.reviewVenue(params.id, params.action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.venues });
      options?.onSuccess?.();
    },
  });
}
