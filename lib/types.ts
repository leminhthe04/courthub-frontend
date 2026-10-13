export type Role = 'CUSTOMER' | 'PARTNER' | 'ADMIN';

export type AuthUser = {
  userId: string;
  fullName?: string;
  email: string | null;
  phone: string | null;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  venueCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCategoryDto = {
  name: string;
  slug?: string;
  isActive?: boolean;
};

export type UpdateCategoryDto = {
  name?: string;
  slug?: string;
  isActive?: boolean;
};

export type Province = {
  province_id: number;
  code: string;
  name: string;
  slug: string;
  type: string;
  ward_count?: number;
};

export type Ward = {
  ward_id: number;
  code: string;
  name: string;
  slug: string;
  type: string;
  province_code: string;
};

export type VenueSummary = {
  id: string;
  name: string;
  categoryId?: string;
  sportType: string;
  categoryName?: string;
  categorySlug?: string;
  address: string;
  city: string;
  description: string | null;
  imageUrl: string | null;
};

export type Court = {
  id: string;
  name: string;
  isActive: boolean;
  deletedAt?: string | null;
};

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type VenuePricingRule = {
  id: string;
  venueId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  hourlyRate: number;
};

export type CreateVenuePricingRuleDto = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  hourlyRate: number;
};

export type VenueDetail = VenueSummary & {
  ownerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  courts: Court[];
  pricingRules?: VenuePricingRule[];
};

export type ScheduleBooking = {
  id: string;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED';
  isMine: boolean;
};

export type ScheduleResponse = {
  venue: VenueDetail;
  date: string;
  timezone: string;
  slotMinutes: 30;
  courts: (Court & { bookings: ScheduleBooking[] })[];
};

export type BookingResult = {
  booking: {
    id: string;
    courtId: string;
    startAt: string;
    endAt: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
    totalAmount: number;
  };
};

export type CustomerBooking = {
  id: string;
  courtId: string;
  courtName: string;
  venueId: string;
  venueName: string;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  totalAmount: number;
  createdAt: string;
};

export type PartnerBooking = {
  id: string;
  venueName: string;
  courtName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string;
  startAt: string;
  endAt: string;
  status: string;
  totalAmount: number;
};

export type AdminVenue = VenueSummary & {
  status: string;
};

export type AdminBooking = {
  id: string;
  venueName: string;
  courtName: string;
  contactPhone: string;
  startAt: string;
  endAt: string;
  status: string;
  totalAmount: number;
};

// DTOs
export type LoginDto = {
  identifier: string;
  password: string;
};

export type RegisterDto = {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
};

export type CreateBookingDto = {
  courtId: string;
  startAt: string;
  endAt: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  note?: string;
};

export type VenueFilterDto = {
  search?: string;
  city?: string;
  categoryId?: string;
  sportType?: string;
};

export type CreateVenueDto = {
  categoryId: string;
  name: string;
  sportType?: string;
  address: string;
  city: string;
  description?: string;
};

export type CreateCourtDto = {
  name: string;
};

export type UpdateCourtDto = {
  name?: string;
  isActive?: boolean;
};

export type UpdateProfileDto = {
  fullName?: string;
  email?: string;
  phone?: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};
