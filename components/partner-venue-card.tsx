'use client';

import { useTranslations } from 'next-intl';
import { Link } from '../lib/i18n/routing';
import type { VenueDetail } from '../lib/types';

interface PartnerVenueCardProps {
  venue: VenueDetail;
}

export function PartnerVenueCard({ venue }: PartnerVenueCardProps) {
  const t = useTranslations('partnerDashboard');

  const isApproved = venue.status === 'APPROVED';
  const isPending = venue.status === 'PENDING';

  return (
    <article className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div>
        {/* Status & Sport Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            {venue.sportType}
          </span>
          {/* Hide badge when venue is APPROVED */}
          {!isApproved && (
            <span
              className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                isPending ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {venue.status}
            </span>
          )}
        </div>

        {/* Venue Info */}
        <h3 className="mt-3 text-lg font-black text-slate-900">{venue.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {venue.address}, {venue.city}
        </p>
        {venue.description && (
          <p className="mt-2 line-clamp-2 text-xs text-slate-600">{venue.description}</p>
        )}

        {/* Court Info */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>{t('courtCount', { count: venue.courts.length })}</span>
          <span className="text-slate-300">•</span>
          <span>
            {venue.courts.filter((c) => c.isActive).length} {t('activeStatus').toLowerCase()}
          </span>
        </div>
      </div>

      {/* Actions / Status Notices */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        {isApproved ? (
          <Link
            href={`/partner/venues/${venue.id}`}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {t('manageCourts')}
          </Link>
        ) : isPending ? (
          <p className="rounded bg-amber-50 p-2.5 text-xs text-amber-800 font-medium">
            {t('pendingNotice')}
          </p>
        ) : (
          <p className="rounded bg-rose-50 p-2.5 text-xs text-rose-800 font-medium">
            {t('rejectedNotice')}
          </p>
        )}
      </div>
    </article>
  );
}
