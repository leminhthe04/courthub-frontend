import { httpClient, type IHttpClient } from '../http';
import type {
  Court,
  CreateCourtDto,
  CreateVenueDto,
  CreateVenuePricingRuleDto,
  PartnerBooking,
  UpdateCourtDto,
  VenueDetail,
  VenuePricingRule,
} from '../types';

export interface IPartnerService {
  listVenues(): Promise<VenueDetail[]>;
  listBookings(): Promise<PartnerBooking[]>;
  createVenue(dto: CreateVenueDto): Promise<VenueDetail>;
  createCourt(venueId: string, dto: CreateCourtDto): Promise<Court>;
  updateCourt(courtId: string, dto: UpdateCourtDto): Promise<Court>;
  deleteCourt(courtId: string): Promise<Court>;
  transitionBooking(id: string, action: 'confirm' | 'reject'): Promise<PartnerBooking>;
  listPricingRules(venueId: string): Promise<VenuePricingRule[]>;
  createPricingRule(venueId: string, dto: CreateVenuePricingRuleDto): Promise<VenuePricingRule>;
  deletePricingRule(venueId: string, ruleId: string): Promise<VenuePricingRule>;
  setPricingRules(venueId: string, rules: CreateVenuePricingRuleDto[]): Promise<VenuePricingRule[]>;
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

  updateCourt(courtId: string, dto: UpdateCourtDto): Promise<Court> {
    return this.client.patch<Court>(`/partner/venues/courts/${courtId}`, dto);
  }

  deleteCourt(courtId: string): Promise<Court> {
    return this.client.delete<Court>(`/partner/venues/courts/${courtId}`);
  }

  transitionBooking(id: string, action: 'confirm' | 'reject'): Promise<PartnerBooking> {
    return this.client.post<PartnerBooking>(`/partner/bookings/${id}/${action}`, {});
  }

  listPricingRules(venueId: string): Promise<VenuePricingRule[]> {
    return this.client.get<VenuePricingRule[]>(`/partner/venues/${venueId}/pricing-rules`);
  }

  createPricingRule(venueId: string, dto: CreateVenuePricingRuleDto): Promise<VenuePricingRule> {
    return this.client.post<VenuePricingRule>(`/partner/venues/${venueId}/pricing-rules`, dto);
  }

  deletePricingRule(venueId: string, ruleId: string): Promise<VenuePricingRule> {
    return this.client.delete<VenuePricingRule>(
      `/partner/venues/${venueId}/pricing-rules/${ruleId}`,
    );
  }

  setPricingRules(
    venueId: string,
    rules: CreateVenuePricingRuleDto[],
  ): Promise<VenuePricingRule[]> {
    return this.client.put<VenuePricingRule[]>(`/partner/venues/${venueId}/pricing-rules`, {
      rules,
    });
  }
}

export const partnerService: IPartnerService = new PartnerService();
