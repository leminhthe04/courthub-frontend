'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, formatDate, formatDateTime, formatTimeRange } from '../lib/formatters';
import type { PaymentStatus } from '../lib/services/payments.service';

export function PaymentBookingSummary({ payment }: { payment: PaymentStatus }) {
  const locale = useLocale();
  const t = useTranslations('booking');

  if (
    !payment.venue ||
    !payment.court ||
    !payment.startAt ||
    !payment.endAt ||
    !payment.createdAt
  ) {
    return null;
  }

  return (
    <div className="mt-8 rounded border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-black text-slate-900">{t('paymentBookingDetails')}</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-bold text-slate-500">{t('venue')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{payment.venue.name}</dd>
          <dd className="text-slate-600">
            {payment.venue.address}, {payment.venue.city}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('court')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{payment.court.name}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('date')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatDate(payment.startAt, locale)}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('time')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatTimeRange(payment.startAt, payment.endAt)}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('contactName')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{payment.contactName}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('contactEmail')}</dt>
          <dd className="mt-1 break-all font-semibold text-slate-900">
            {payment.contactEmail || '-'}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('contactPhone')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{payment.contactPhone}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('bookedAt')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{formatDateTime(payment.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">{t('total')}</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatCurrency(payment.amount, locale)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
