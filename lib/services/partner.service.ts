import { httpClient, type IHttpClient } from '../http';
import type { Court, CreateCourtDto, CreateVenueDto, PartnerBooking, VenueDetail } from '../types';

export interface IPartnerService {
  listVenues(): Promise<VenueDetail[]>;
  listBookings(): Promise<PartnerBooking[]>;
  createVenue(dto: CreateVenueDto): Promise<VenueDetail>;
  createCourt(venueId: string, dto: CreateCourtDto): Promise<Court>;
  transitionBooking(id: string, action: 'confirm' | 'reject'): Promise<PartnerBooking>;
}

export class PartnerService implements IPartnerService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  listVenues(): Promise<VenueDetail[]> {
    return this.client.get<VenueDetail[]>('/partner/venues');
  }

  listBookings(): Promise<PartnerBooking[]> {
    return this.client.get<PartnerBooking[]>('/partner/bookings');
  }

  createVenue(dto: CreateVenueDto): Promise<VenueDetail> {
    return this.client.post<VenueDetail>('/partner/venues', dto);
  }

  createCourt(venueId: string, dto: CreateCourtDto): Promise<Court> {
    return this.client.post<Court>(`/partner/venues/${venueId}/courts`, dto);
  }

  transitionBooking(id: string, action: 'confirm' | 'reject'): Promise<PartnerBooking> {
    return this.client.post<PartnerBooking>(`/partner/bookings/${id}/${action}`, {});
  }
}

export const partnerService: IPartnerService = new PartnerService();
