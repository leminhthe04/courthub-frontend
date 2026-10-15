'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { paymentsService } from '../lib/services/payments.service';
import { showToast } from '../lib/toast';

export function PendingPaymentActions({
  paymentId,
  expiresAt,
}: {
  paymentId: string;
  expiresAt: string;
}) {
  const t = useTranslations('customerHistory');
  const queryClient = useQueryClient();
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  );
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingMs(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (remainingMs === 0) {
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    }
  }, [remainingMs, queryClient]);

  const timeLabel = useMemo(() => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [remainingMs]);

  const handleRetry = async () => {
    setIsOpening(true);
    try {
      const payment = await paymentsService.retry(paymentId);
      window.location.assign(payment.checkoutUrl ?? '');
    } catch {
      showToast.error(t('paymentExpired'));
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    } finally {
      setIsOpening(false);
    }
  };

  if (remainingMs === 0) {
    return <span className="text-xs font-semibold text-rose-600">{t('paymentExpired')}</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
      <span className="font-bold tabular-nums text-amber-700" aria-live="polite">
        {t('paymentExpiresIn', { time: timeLabel })}
      </span>
      <button
        type="button"
        onClick={handleRetry}
        disabled={isOpening}
        className="inline-flex items-center gap-1.5 rounded bg-orange-500 px-3 py-1.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
      >
        <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
        {isOpening ? t('openingPayment') : t('payNow')}
      </button>
    </div>
  );
}
