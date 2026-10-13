import { httpClient, type IHttpClient } from '../http';
import type { BookingResult, CreateBookingDto, CustomerBooking } from '../types';

export interface IBookingsService {
  create(dto: CreateBookingDto): Promise<BookingResult>;
  listMine(): Promise<CustomerBooking[]>;
}

export class BookingsService implements IBookingsService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  create(dto: CreateBookingDto): Promise<BookingResult> {
    return this.client.post<BookingResult>('/bookings', dto);
  }

  listMine(): Promise<CustomerBooking[]> {
    return this.client.get<CustomerBooking[]>('/bookings/me');
  }
}

export const bookingsService: IBookingsService = new BookingsService();
