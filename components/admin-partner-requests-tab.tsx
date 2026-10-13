'use client';

import { useTranslations } from 'next-intl';
import type { PartnerRequest } from '../lib/types';

interface AdminPartnerRequestsTabProps {
  requests: PartnerRequest[];
  isReviewing: boolean;
  onReview: (request: PartnerRequest, action: 'approve' | 'reject') => void;
}

export function AdminPartnerRequestsTab({
  requests,
  isReviewing,
  onReview,
}: AdminPartnerRequestsTabProps) {
  const t = useTranslations('adminDashboard');
  const pending = requests.filter((request) => request.status === 'PENDING');

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-900">{t('partnerRequestsTitle')}</h2>
        <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
          {pending.length} {t('pendingRequests')}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {requests.length === 0 && (
          <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            {t('noPartnerRequests')}
          </div>
        )}
        {requests.map((request) => (
          <article
            key={request.id}
            className="flex flex-col justify-between gap-4 rounded border border-slate-200 bg-white p-5 shadow-xs lg:flex-row lg:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">{request.userName}</h3>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                    request.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : request.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {request.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {request.userEmail || request.userPhone || '—'}
              </p>
              {request.message && <p className="mt-2 text-sm text-slate-700">{request.message}</p>}
            </div>
            {request.status === 'PENDING' && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => onReview(request, 'reject')}
                  className="rounded border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  {t('reject')}
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => onReview(request, 'approve')}
                  className="rounded bg-orange-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-700 disabled:opacity-60"
                >
                  {t('approve')}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
