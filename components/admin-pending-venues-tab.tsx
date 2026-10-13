'use client';

import { useTranslations } from 'next-intl';
import type { AdminVenue } from '../lib/types';

interface AdminPendingVenuesTabProps {
  venues: AdminVenue[];
  pendingCount: number;
  isReviewing: boolean;
  onReview: (id: string, action: 'approve' | 'reject') => void;
}

export function AdminPendingVenuesTab({
  venues,
  pendingCount,
  isReviewing,
  onReview,
}: AdminPendingVenuesTabProps) {
  const t = useTranslations('adminDashboard');

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-black text-slate-900">{t('pendingVenues')}</h2>
      <div className="mt-4 grid gap-3">
        {pendingCount === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            {t('noPendingVenues')}
          </div>
        )}
        {venues
          .filter((item) => item.status === 'PENDING')
          .map((venue) => (
            <article
              key={venue.id}
              className="flex flex-col justify-between gap-4 rounded border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center"
            >
              <div>
                <h3 className="font-bold text-slate-900">{venue.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {venue.sportType} · {venue.address}, {venue.city}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onReview(venue.id, 'reject')}
                  disabled={isReviewing}
                  className="cursor-pointer rounded border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  {t('reject')}
                </button>
                <button
                  type="button"
                  onClick={() => onReview(venue.id, 'approve')}
                  disabled={isReviewing}
                  className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  {t('approve')}
                </button>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
