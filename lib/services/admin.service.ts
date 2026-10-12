import { httpClient, type IHttpClient } from '../http';
import type { AdminBooking, AdminVenue } from '../types';

export interface IAdminService {
  listVenues(): Promise<AdminVenue[]>;
  listBookings(): Promise<AdminBooking[]>;
  reviewVenue(id: string, action: 'approve' | 'reject'): Promise<AdminVenue>;
}

export class AdminService implements IAdminService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  listVenues(): Promise<AdminVenue[]> {
    return this.client.get<AdminVenue[]>('/admin/venues');
  }

  listBookings(): Promise<AdminBooking[]> {
    return this.client.get<AdminBooking[]>('/admin/bookings');
  }

  reviewVenue(id: string, action: 'approve' | 'reject'): Promise<AdminVenue> {
    return this.client.post<AdminVenue>(`/admin/venues/${id}/${action}`);
  }
}

export const adminService: IAdminService = new AdminService();
