import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../lib/services';
import type {
  AuthUser,
  ConfirmPasswordResetDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from '../lib/types';

export const AUTH_KEYS = {
  me: ['me'] as const,
};

export function useCurrentUser() {
  const query = useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: () => authService.getMe(),
    enabled: true,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    user: query.data?.user,
    hasSession: Boolean(query.data?.user),
  };
}

export function useLogin(options?: { onSuccess?: (data: { user: AuthUser }) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LoginDto) => authService.login(dto),
    onSuccess: (result) => {
      queryClient.setQueryData(AUTH_KEYS.me, result);
      options?.onSuccess?.(result);
    },
  });
}

export function useRegister(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: RegisterDto) => authService.register(dto),
    onSuccess: (result) => {
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
      queryClient.setQueryData(AUTH_KEYS.me, null);
      options?.onSuccess?.();
    },
    onError: () => {
      queryClient.setQueryData(AUTH_KEYS.me, null);
    },
  });
}

export function useUpdateProfile(options?: {
  onSuccess?: (data: { user: AuthUser }) => void;
  onError?: (err: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => authService.updateProfile(dto),
    onSuccess: (result) => {
      queryClient.setQueryData(AUTH_KEYS.me, result);
      options?.onSuccess?.(result);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useChangePassword(options?: {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}) {
  return useMutation({
    mutationFn: () => authService.requestPasswordResetForCurrentUser(),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useRequestPasswordReset(options?: {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}) {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset({ email }),
    onSuccess: () => options?.onSuccess?.(),
    onError: (err) => options?.onError?.(err),
  });
}

export function useConfirmPasswordReset(options?: {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}) {
  return useMutation({
    mutationFn: (dto: ConfirmPasswordResetDto) => authService.confirmPasswordReset(dto),
    onSuccess: () => options?.onSuccess?.(),
    onError: (err) => options?.onError?.(err),
  });
}
