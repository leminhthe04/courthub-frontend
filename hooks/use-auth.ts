import { useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearSessionHint,
  getHasSessionHint,
  setSessionHint,
  subscribeSessionChange,
} from '../lib/http';
import { authService } from '../lib/services';
import type { LoginDto, RegisterDto } from '../lib/types';

export const AUTH_KEYS = {
  me: ['me'] as const,
};

function useHasSessionHint(): boolean {
  return useSyncExternalStore(
    subscribeSessionChange,
    getHasSessionHint,
    () => false, // server snapshot
  );
}

export function useCurrentUser() {
  const queryClient = useQueryClient();
  const hasSessionHint = useHasSessionHint();

  const cachedData = queryClient.getQueryData<{ user?: unknown }>(AUTH_KEYS.me);
  const isEnabled = hasSessionHint || !!cachedData;

  const query = useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: () => authService.getMe(),
    enabled: isEnabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    user: query.data?.user,
    hasSession: isEnabled,
  };
}

export function useLogin(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LoginDto) => authService.login(dto),
    onSuccess: (result) => {
      setSessionHint();
      queryClient.setQueryData(AUTH_KEYS.me, result);
      options?.onSuccess?.();
    },
  });
}

export function useRegister(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: RegisterDto) => authService.register(dto),
    onSuccess: (result) => {
      setSessionHint();
      queryClient.setQueryData(AUTH_KEYS.me, result);
      options?.onSuccess?.();
    },
  });
}

export function useLogout(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearSessionHint();
      queryClient.setQueryData(AUTH_KEYS.me, null);
      options?.onSuccess?.();
    },
    onError: () => {
      clearSessionHint();
      queryClient.setQueryData(AUTH_KEYS.me, null);
    },
  });
}
