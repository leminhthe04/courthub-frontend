'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCurrentUser, usePartnerVenues } from '../hooks';
import { Link } from '../lib/i18n/routing';
import { PartnerVenueCourtsTab } from './partner-venue-courts-tab';
import { PartnerVenueOverviewTab } from './partner-venue-overview-tab';
import { PartnerVenuePricingTab } from './partner-venue-pricing-tab';
import { PartnerVenueBookingsTab } from './partner-venue-bookings-tab';
import { PartnerVenueDetailsTab } from './partner-venue-details-tab';

interface PartnerVenueManagerProps {
  venueId: string;
}

export function PartnerVenueManager({ venueId }: PartnerVenueManagerProps) {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'courts' | 'pricing' | 'bookings' | 'details'
  >('overview');

  const me = useCurrentUser();
  const isPartner = me.user?.role === 'PARTNER';

  const { data: venues, isLoading } = usePartnerVenues(isPartner);
  const venue = venues?.find((v) => v.id === venueId);

  if (me.isLoading || isLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">{tCommon('loading')}</div>;
  }

  if (me.isError || !isPartner) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-3 text-slate-500">
          {locale === 'vi'
            ? 'Khu vực này dành riêng cho tài khoản đối tác (PARTNER).'
            : 'This area is restricted to partner (PARTNER) accounts.'}
        </p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-black text-slate-900">{t('venueNotFound')}</h2>
        <Link
          href="/partner"
          className="mt-4 inline-block font-bold text-emerald-600 hover:text-emerald-700"
        >
          {t('backToVenues')}
        </Link>
      </div>
    );
  }

  const activeCourtsCount = venue.courts.filter((c) => c.isActive).length;
  const pricingRules = venue.pricingRules ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/partner"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToVenues')}
        </Link>
      </div>

      {/* Venue Header Banner */}
      <div className="mt-4 rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {venue.sportType}
              </span>
              {venue.status !== 'APPROVED' && (
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                    venue.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {venue.status}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{venue.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {venue.address}, {venue.ward}, {venue.province}
            </p>
            {venue.description && (
              <p className="mt-2 max-w-3xl text-sm text-slate-600">{venue.description}</p>
            )}
          </div>

          <div className="flex gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100 self-start sm:self-auto">
            <div className="text-center">
              <span className="block text-2xl font-black text-slate-900">
                {venue.courts.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">{t('tabCourts')}</span>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center">
              <span className="block text-2xl font-black text-emerald-600">
                {activeCourtsCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">{t('activeStatus')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-8 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition cursor-pointer ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabOverview')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition ${
            activeTab === 'bookings'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabBookings')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('courts')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition cursor-pointer ${
            activeTab === 'courts'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabCourts')}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-bold">
            {venue.courts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition cursor-pointer ${
            activeTab === 'pricing'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabPricing')}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-bold">
            {pricingRules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition cursor-pointer ${
            activeTab === 'details'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabDetails')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <PartnerVenueOverviewTab venueId={venue.id} />}
      {activeTab === 'courts' && <PartnerVenueCourtsTab venue={venue} />}
      {activeTab === 'pricing' && <PartnerVenuePricingTab venue={venue} />}
      {activeTab === 'bookings' && <PartnerVenueBookingsTab venueId={venue.id} />}
      {activeTab === 'details' && <PartnerVenueDetailsTab venue={venue} />}
    </div>
  );
}
