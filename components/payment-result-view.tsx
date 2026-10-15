'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useCurrentUser } from '../hooks';
import { Link } from '../lib/i18n/routing';
import { paymentsService, type PaymentStatus } from '../lib/services/payments.service';
import { PaymentBookingSummary } from './payment-booking-summary';
import { usePaymentSocket } from './payment-socket-provider';

export function PaymentResultView({
  paymentId,
  cancelled,
}: {
  paymentId: string;
  cancelled: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations('booking');
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState(false);
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const onUpdate = useCallback(
    (next: PaymentStatus) =>
      setPayment((current) => (current ? { ...current, status: next.status } : next)),
    [],
  );
  usePaymentSocket(paymentId, onUpdate);

  useEffect(() => {
    if (!paymentId) return;
    const request = cancelled
      ? paymentsService.cancel(paymentId)
      : paymentsService.getStatus(paymentId);
    void request
      .then((result) => {
        setPayment(result);
        if (cancelled) {
          void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        }
      })
      .catch(() => setError(true));
  }, [paymentId, cancelled, queryClient]);

  const terminal =
    payment?.status === 'PAID' ||
    payment?.status === 'CANCELLED' ||
    payment?.status === 'EXPIRED' ||
    payment?.status === 'FAILED';
  const isSuccess = payment?.status === 'PAID';
  const isCustomer = currentUser.user?.role === 'CUSTOMER';
  const title =
    payment?.status === 'PAID'
      ? t('paymentSuccessTitle')
      : terminal
        ? t('paymentFailedTitle')
        : t('paymentPendingTitle');

  return (
    <div className="mx-auto max-w-xl px-5 py-16 text-center">
      {payment && terminal && (
        <div
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
            isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
          aria-label={isSuccess ? t('paymentSuccessTitle') : t('paymentFailedTitle')}
        >
          {isSuccess ? (
            <Check className="h-9 w-9" aria-hidden="true" />
          ) : (
            <X className="h-9 w-9" aria-hidden="true" />
          )}
        </div>
      )}
      <h1 className="text-3xl font-black text-slate-900">
        {error ? t('paymentStatusError') : title}
      </h1>
      {payment && <p className="mt-5 font-bold text-emerald-700">{payment.status}</p>}
      {payment && <PaymentBookingSummary payment={payment} />}
      {terminal && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            locale={locale}
            className="inline-flex rounded bg-slate-950 px-6 py-3 text-sm font-bold text-white"
          >
            {t('backToVenues')}
          </Link>
          {isCustomer && (
            <Link
              href="/history"
              locale={locale}
              className="inline-flex rounded border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
            >
              {t('viewHistory')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
