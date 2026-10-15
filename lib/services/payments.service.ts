import { httpClient } from '../http';

export type PaymentStatus = {
  paymentId: string;
  bookingId: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  amount: number;
  expiresAt: string;
  checkoutUrl?: string;
  bookingStatus?: 'PENDING' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  contactName?: string;
  contactEmail?: string | null;
  contactPhone?: string;
  startAt?: string;
  endAt?: string;
  createdAt?: string;
  court?: { id: string; name: string };
  venue?: {
    id: string;
    name: string;
    address: string;
    ward: string;
    province: string;
  };
};

export const paymentsService = {
  getStatus(paymentId: string) {
    return httpClient.get<PaymentStatus>(`/payments/${paymentId}/status`);
  },
  cancel(paymentId: string) {
    return httpClient.post<PaymentStatus>(`/payments/${paymentId}/cancel`);
  },
  retry(paymentId: string) {
    return httpClient.post<PaymentStatus>(`/payments/${paymentId}/retry`);
  },
};
