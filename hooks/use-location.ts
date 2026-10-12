import { useQuery } from '@tanstack/react-query';
import { locationService } from '../lib/services';

export const LOCATION_KEYS = {
  provinces: ['provinces'] as const,
  wards: (provinceCode: string) => ['wards', provinceCode] as const,
};

export function useProvinces() {
  return useQuery({
    queryKey: LOCATION_KEYS.provinces,
    queryFn: ({ signal }) => locationService.getProvinces(signal),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}

export function useWards(provinceCode?: string) {
  return useQuery({
    queryKey: LOCATION_KEYS.wards(provinceCode ?? ''),
    queryFn: ({ signal }) => locationService.getWardsByProvince(provinceCode!, signal),
    enabled: !!provinceCode,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });
}
