'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCreatePartnerVenue, useCurrentUser, usePartnerVenues } from '../hooks';
import { PartnerVenueCard } from './partner-venue-card';
import { PartnerVenueForm } from './partner-venue-form';

export function PartnerDashboard() {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');
  const [showVenueForm, setShowVenueForm] = useState(false);
  const me = useCurrentUser();
  const isPartner = me.user?.role === 'PARTNER';
  const venues = usePartnerVenues(isPartner);
  const createVenue = useCreatePartnerVenue({
    onSuccess: () => setShowVenueForm(false),
  });

  if (me.isLoading) {
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

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col justify-end gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setShowVenueForm((current) => !current)}
          className="cursor-pointer self-start rounded bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
        >
          {showVenueForm ? t('hideVenueForm') : `+ ${t('createNewVenue')}`}
        </button>
      </div>

      {showVenueForm && (
        <div className="mt-6">
          <PartnerVenueForm
            mode="create"
            isSubmitting={createVenue.isPending}
            onSubmit={(dto) => createVenue.mutate(dto)}
            onCancel={() => setShowVenueForm(false)}
          />
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-950">{t('yourVenues')}</h2>
          {venues.data && venues.data.length > 0 && (
            <span className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {venues.data.length} venues
            </span>
          )}
        </div>

        <div className="relative mt-4 min-h-[24rem]">
          {venues.isLoading ? (
            <div className="p-8 text-center text-slate-500">{tCommon('loading')}</div>
          ) : venues.data && venues.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venues.data.map((venue) => (
                <PartnerVenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="font-bold text-slate-800">{t('noVenues')}</h3>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
