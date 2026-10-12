import axios, { type AxiosInstance } from 'axios';
import type { Province, Ward } from '../types';

export interface TTPResponse<T> {
  success: boolean;
  message: string;
  data: T;
  metadata?: {
    total: number;
    page: number;
    limit: number;
    data_version?: string;
  };
}

export interface ILocationService {
  getProvinces(signal?: AbortSignal): Promise<Province[]>;
  getWardsByProvince(provinceCode: string, signal?: AbortSignal): Promise<Ward[]>;
}

export class LocationService implements ILocationService {
  private readonly client: AxiosInstance;

  constructor(baseURL = 'https://www.tinhthanhpho.com/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  async getProvinces(signal?: AbortSignal): Promise<Province[]> {
    const allProvinces: Province[] = [];
    let page = 1;
    const limit = 100;
    let total = 0;

    do {
      const response = await this.client.get<TTPResponse<Province[]>>('/new-provinces', {
        params: { limit, page },
        signal,
      });

      const items = response.data?.data ?? [];
      allProvinces.push(...items);
      total = response.data?.metadata?.total ?? allProvinces.length;
      page += 1;
    } while (allProvinces.length < total && page <= 5);

    // Sort alphabetically by Vietnamese name for optimal user experience
    return allProvinces.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  async getWardsByProvince(provinceCode: string, signal?: AbortSignal): Promise<Ward[]> {
    if (!provinceCode) return [];

    const allWards: Ward[] = [];
    let page = 1;
    const limit = 500;
    let total = 0;

    do {
      const response = await this.client.get<TTPResponse<Ward[]>>(
        `/new-provinces/${encodeURIComponent(provinceCode)}/wards`,
        {
          params: { limit, page },
          signal,
        },
      );

      const items = response.data?.data ?? [];
      allWards.push(...items);
      total = response.data?.metadata?.total ?? allWards.length;
      page += 1;
    } while (allWards.length < total && page <= 10);

    // Sort alphabetically by Vietnamese name
    return allWards.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }
}

export const locationService: ILocationService = new LocationService();
