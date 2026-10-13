import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../lib/services';
import type { MutationCallbacks } from './use-partner';

export const ADMIN_KEYS = {
  venues: ['admin-venues'] as const,
  bookings: ['admin-bookings'] as const,
  users: ['admin-users'] as const,
  partnerRequests: ['admin-partner-requests'] as const,
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

export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: ADMIN_KEYS.users,
    queryFn: () => adminService.listUsers(),
    enabled,
  });
}

export function useUpdateAdminUserRole(options?: MutationCallbacks) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; role: 'CUSTOMER' | 'PARTNER' | 'ADMIN' }) =>
      adminService.updateUserRole(params.id, params.role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error),
  });
}

export function useUpdateAdminUserStatus(options?: MutationCallbacks) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(params.id, params.isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error),
  });
}

export function useAdminPartnerRequests(enabled = true) {
  return useQuery({
    queryKey: ADMIN_KEYS.partnerRequests,
    queryFn: () => adminService.listPartnerRequests(),
    enabled,
  });
}

export function useReviewPartnerRequest(options?: MutationCallbacks) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; action: 'approve' | 'reject' }) =>
      adminService.reviewPartnerRequest(params.id, params.action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.partnerRequests });
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error),
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
