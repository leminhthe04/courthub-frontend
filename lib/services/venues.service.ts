import { httpClient, type IHttpClient } from '../http';
import type { ScheduleResponse, VenueDetail, VenueFilterDto, VenueSummary } from '../types';

export interface IVenuesService {
  listPublic(filter?: VenueFilterDto): Promise<VenueSummary[]>;
  getPublic(id: string): Promise<VenueDetail>;
  getSchedule(venueId: string, date: string): Promise<ScheduleResponse>;
}

export class VenuesService implements IVenuesService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  listPublic(filter?: VenueFilterDto): Promise<VenueSummary[]> {
    const params = new URLSearchParams();
    if (filter?.search) params.set('search', filter.search);
    if (filter?.city) params.set('city', filter.city);
    if (filter?.sportType) params.set('sportType', filter.sportType);

    const queryString = params.toString();
    const endpoint = queryString ? `/venues?${queryString}` : '/venues';
    return this.client.get<VenueSummary[]>(endpoint);
  }

  getPublic(id: string): Promise<VenueDetail> {
    return this.client.get<VenueDetail>(`/venues/${id}`);
  }

  getSchedule(venueId: string, date: string): Promise<ScheduleResponse> {
    return this.client.get<ScheduleResponse>(`/venues/${venueId}/schedule?date=${date}`);
  }
}

export const venuesService: IVenuesService = new VenuesService();
