export type Role = 'CUSTOMER' | 'PARTNER' | 'ADMIN';

export type AuthUser = {
  userId: string;
  fullName?: string;
  email: string | null;
  phone: string | null;
  role: Role;
};

export type VenueSummary = {
  id: string;
  name: string;
  sportType: string;
  address: string;
  city: string;
  description: string | null;
  imageUrl: string | null;
};

export type Court = {
  id: string;
  name: string;
  hourlyRate: number;
  isActive: boolean;
};

export type OperatingHours = {
  id: string;
  venueId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
};

export type VenueDetail = VenueSummary & {
  ownerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  courts: Court[];
  operatingHours: OperatingHours[];
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
  hours: OperatingHours | null;
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
  guestToken: string | null;
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
  guestName: string | null;
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
  guestName?: string;
  contactPhone?: string;
  note?: string;
};

export type VenueFilterDto = {
  search?: string;
  city?: string;
  sportType?: string;
};

export type CreateVenueDto = {
  name: string;
  sportType: string;
  address: string;
  city: string;
  description?: string;
};

export type CreateCourtDto = {
  name: string;
  hourlyRate: number;
};
