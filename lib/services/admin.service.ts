import { httpClient, type IHttpClient } from '../http';
import type { AdminBooking, AdminUser, AdminVenue, PartnerRequest } from '../types';

export interface IAdminService {
  listVenues(): Promise<AdminVenue[]>;
  listBookings(): Promise<AdminBooking[]>;
  listUsers(): Promise<AdminUser[]>;
  updateUserRole(id: string, role: AdminUser['role']): Promise<AdminUser>;
  updateUserStatus(id: string, isActive: boolean): Promise<AdminUser>;
  reviewVenue(id: string, action: 'approve' | 'reject'): Promise<AdminVenue>;
  listPartnerRequests(): Promise<PartnerRequest[]>;
  reviewPartnerRequest(id: string, action: 'approve' | 'reject'): Promise<PartnerRequest>;
}

export class AdminService implements IAdminService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  listVenues(): Promise<AdminVenue[]> {
    return this.client.get<AdminVenue[]>('/admin/venues');
  }

  listBookings(): Promise<AdminBooking[]> {
    return this.client.get<AdminBooking[]>('/admin/bookings');
  }

  listUsers(): Promise<AdminUser[]> {
    return this.client.get<AdminUser[]>('/admin/users');
  }

  updateUserRole(id: string, role: AdminUser['role']): Promise<AdminUser> {
    return this.client.patch<AdminUser>(`/admin/users/${id}/role`, { role });
  }

  updateUserStatus(id: string, isActive: boolean): Promise<AdminUser> {
    return this.client.patch<AdminUser>(`/admin/users/${id}/status`, { isActive });
  }

  reviewVenue(id: string, action: 'approve' | 'reject'): Promise<AdminVenue> {
    return this.client.post<AdminVenue>(`/admin/venues/${id}/${action}`);
  }

  listPartnerRequests(): Promise<PartnerRequest[]> {
    return this.client.get<PartnerRequest[]>('/admin/partner-requests');
  }

  reviewPartnerRequest(id: string, action: 'approve' | 'reject'): Promise<PartnerRequest> {
    return this.client.post<PartnerRequest>(`/admin/partner-requests/${id}/${action}`);
  }
}

export const adminService: IAdminService = new AdminService();
