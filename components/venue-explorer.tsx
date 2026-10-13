'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCategories, useVenues } from '../hooks';
import { Link } from '../lib/i18n/routing';
import { MoveRight } from 'lucide-react';

export function VenueExplorer() {
  const t = useTranslations('venues');
  const tCommon = useTranslations('common');

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [sportType, setSportType] = useState('');
  const [submitted, setSubmitted] = useState({ search: '', city: '', sportType: '' });

  const { data: categories } = useCategories();
  const venues = useVenues(submitted);

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12">
      <div className="relative overflow-hidden bg-slate-950 px-6 py-14 text-white shadow-xl shadow-slate-200 sm:px-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 bg-emerald-400/30 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
            CourtHub
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{t('title')}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">{t('subtitle')}</p>
        </div>
      </div>

      <form
        className="relative rounded-b z-10 -mt-7 grid gap-3 border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-[1.5fr_1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted({ search, city, sportType });
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="rounded border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder={t('filterCity')}
          className="rounded border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
        <select
          value={sportType}
          onChange={(event) => setSportType(event.target.value)}
          className="rounded border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
        >
          <option value="">{t('allSports')}</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="cursor-pointer rounded bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700"
        >
          {tCommon('search')}
        </button>
      </form>

      <div className="mt-12 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
            CourtHub Explorer
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{t('title')}</h2>
        </div>
        <p className="hidden text-sm text-slate-500 sm:block">
          {venues.data?.length ?? 0} {tCommon('all').toLowerCase()}
        </p>
      </div>

      {venues.isLoading && (
        <div className="mt-8 border border-slate-200 bg-white p-8 text-slate-500">
          {tCommon('loading')}
        </div>
      )}
      {venues.isError && (
        <div className="mt-8 border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {tCommon('loading')}
        </div>
      )}
      {!venues.isLoading && !venues.isError && venues.data?.length === 0 && (
        <div className="mt-8 border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {t('noVenues')}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {venues.data?.map((venue) => (
          <Link
            key={venue.id}
            href={`/venues/${venue.id}`}
            className="group flex h-full flex-col overflow-hidden rounded border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
          >
            <div
              className="relative h-40 overflow-hidden bg-linear-to-br from-emerald-400 via-teal-500 to-slate-900"
              style={
                venue.imageUrl
                  ? {
                      backgroundImage: `url(${venue.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {venue.imageUrl && (
                <div className="absolute inset-0 bg-slate-950/25 transition group-hover:bg-slate-950/10" />
              )}
              <span className="rounded absolute left-4 top-4 bg-white/90 px-3 py-1 text-xs font-bold text-slate-800">
                {venue.sportType}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-xl font-bold group-hover:text-emerald-600">{venue.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {venue.address}, {venue.city}
              </p>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                {venue.description ?? ''}
              </p>
              <span className="mt-auto inline-flex pt-5 text-sm font-bold text-emerald-600">
                {t('viewDetails')} <MoveRight className="ml-2 h-5 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
