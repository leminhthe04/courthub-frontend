import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '../lib/services';
import type { CreateCategoryDto, UpdateCategoryDto } from '../lib/types';
import type { MutationCallbacks } from './use-partner';

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
  admin: ['admin-categories'] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: () => categoriesService.list(),
  });
}

export function useAdminCategories(enabled = true) {
  return useQuery({
    queryKey: CATEGORY_KEYS.admin,
    queryFn: () => categoriesService.adminList(),
    enabled,
  });
}

export function useCreateCategory(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => categoriesService.adminCreate(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.admin });
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useUpdateCategory(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; dto: UpdateCategoryDto }) =>
      categoriesService.adminUpdate(params.id, params.dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.admin });
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useDeleteCategory(options?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesService.adminDelete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.admin });
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}
