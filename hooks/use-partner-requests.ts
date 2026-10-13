import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerRequestsService } from '../lib/services';
import type { PartnerRequest } from '../lib/types';
import { AUTH_KEYS } from './use-auth';

export const PARTNER_REQUEST_KEYS = {
  mine: ['partner-request-me'] as const,
};

export function useMyPartnerRequest(enabled = true) {
  return useQuery({
    queryKey: PARTNER_REQUEST_KEYS.mine,
    queryFn: () => partnerRequestsService.getMine(),
    enabled,
  });
}

export function useSubmitPartnerRequest(options?: {
  onSuccess?: (request: PartnerRequest) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message?: string) => partnerRequestsService.submit(message),
    onSuccess: (request) => {
      queryClient.setQueryData(PARTNER_REQUEST_KEYS.mine, request);
      void queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      options?.onSuccess?.(request);
    },
    onError: (error) => options?.onError?.(error),
  });
}
