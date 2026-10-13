import { httpClient, type IHttpClient } from '../http';
import type { PartnerRequest } from '../types';

export interface IPartnerRequestsService {
  getMine(): Promise<PartnerRequest | null>;
  submit(message?: string): Promise<PartnerRequest>;
}

export class PartnerRequestsService implements IPartnerRequestsService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  getMine(): Promise<PartnerRequest | null> {
    return this.client.get<PartnerRequest | null>('/partner-requests/me');
  }

  submit(message?: string): Promise<PartnerRequest> {
    return this.client.post<PartnerRequest>('/partner-requests', { message });
  }
}

export const partnerRequestsService: IPartnerRequestsService = new PartnerRequestsService();
