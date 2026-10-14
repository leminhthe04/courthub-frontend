'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useCategories,
  useCreatePartnerVenue,
  useCurrentUser,
  usePartnerVenues,
  useProvinces,
  useWards,
} from '../hooks';
import { PartnerVenueCard } from './partner-venue-card';
import { SearchableSelect } from './searchable-select';

export function PartnerDashboard() {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');

  const { data: categories, isLoading: loadingCategories } = useCategories();
  const [showVenueForm, setShowVenueForm] = useState(false);

  // Form fields
  const [venueName, setVenueName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [description, setDescription] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Location queries
  const provinces = useProvinces();
  const wards = useWards(selectedProvinceCode);

  const me = useCurrentUser();
  const isPartner = me.user?.role === 'PARTNER';

  const venues = usePartnerVenues(isPartner);

  const createVenue = useCreatePartnerVenue({
    onSuccess: () => {
      setVenueName('');
      setCategoryId('');
      setSelectedProvinceCode('');
      setSelectedWardCode('');
      setStreetAddress('');
      setDescription('');
      setLocationError(null);
      setShowVenueForm(false);
    },
  });

  const handleProvinceChange = (newProvinceCode: string) => {
    setSelectedProvinceCode(newProvinceCode);
    setSelectedWardCode('');
    setLocationError(null);
  };

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
      {/* Top Header */}
      <div className="flex flex-col justify-end gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setShowVenueForm((prev) => !prev)}
          className="cursor-pointer self-start sm:self-auto rounded bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          {showVenueForm ? t('hideVenueForm') : `+ ${t('createNewVenue')}`}
        </button>
      </div>

      {/* Collapsible Create Venue Form */}
      {showVenueForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!categoryId) return;
            if (!selectedProvinceCode || !selectedWardCode || !streetAddress.trim()) {
              setLocationError(t('addressValidationWarning'));
              return;
            }

            const selectedProvince = provinces.data?.find((p) => p.code === selectedProvinceCode);
            const selectedWard = wards.data?.find((w) => w.code === selectedWardCode);

            if (
              !selectedProvince ||
              !selectedWard ||
              selectedWard.province_code !== selectedProvinceCode
            ) {
              setLocationError(t('locationLoadError'));
              return;
            }

            const wardDisplay = selectedWard.type
              ? `${selectedWard.type} ${selectedWard.name}`
              : selectedWard.name;
            const fullAddress = `${streetAddress.trim()}, ${wardDisplay}`;

            createVenue.mutate({
              name: venueName.trim(),
              categoryId,
              city: selectedProvince.name,
              address: fullAddress,
              description: description.trim() || undefined,
            });
          }}
          className="mt-6 rounded border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-black text-slate-900">{t('createNewVenue')}</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* Tên cụm sân */}
            <div className="">
              <label htmlFor="venue-name" className="mb-1 block text-xs font-bold text-slate-700">
                {t('venueName')} *
              </label>
              <input
                id="venue-name"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder={t('venueName')}
                className="w-full rounded border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Môn thể thao (Category) */}
            <div className="">
              <label
                htmlFor="venue-category"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                {t('category')} *
              </label>
              <select
                id="venue-category"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="" disabled>
                  {loadingCategories ? tCommon('loading') : t('selectCategoryPlaceholder')}
                </option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 1: Tỉnh / Thành phố (Province / City) */}
            <div>
              <label
                htmlFor="venue-province"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                {t('provinceCity')} *
              </label>
              <SearchableSelect
                id="venue-province"
                value={selectedProvinceCode}
                onChange={handleProvinceChange}
                options={
                  provinces.data?.map((p) => ({
                    value: p.code,
                    label: p.name,
                  })) ?? []
                }
                placeholder={t('selectProvincePlaceholder')}
                searchPlaceholder={t('searchProvincePlaceholder')}
                noResultsText={t('noProvincesFound')}
                disabled={provinces.isLoading}
                isLoading={provinces.isLoading}
                loadingText={t('loadingProvinces')}
              />
              {provinces.isError && (
                <div className="mt-1 flex items-center justify-between text-xs text-rose-600">
                  <span>{t('locationLoadError')}</span>
                  <button
                    type="button"
                    onClick={() => provinces.refetch()}
                    className="underline hover:text-rose-800 cursor-pointer"
                  >
                    {t('retry')}
                  </button>
                </div>
              )}
            </div>

            {/* Field 2: Quận / Huyện / Phường / Xã (Ward / Commune) */}
            <div>
              <label htmlFor="venue-ward" className="mb-1 block text-xs font-bold text-slate-700">
                {t('wardDistrict')} *
              </label>
              <SearchableSelect
                id="venue-ward"
                value={selectedWardCode}
                onChange={(val) => {
                  setSelectedWardCode(val);
                  setLocationError(null);
                }}
                options={
                  wards.data?.map((w) => ({
                    value: w.code,
                    label: w.type ? `${w.type} ${w.name}` : w.name,
                  })) ?? []
                }
                placeholder={
                  !selectedProvinceCode ? t('selectProvinceFirst') : t('selectWardPlaceholder')
                }
                searchPlaceholder={t('searchWardPlaceholder')}
                noResultsText={t('noWardsFound')}
                disabled={!selectedProvinceCode || wards.isLoading}
                isLoading={wards.isLoading}
                loadingText={t('loadingWards')}
              />
              {wards.isError && (
                <div className="mt-1 flex items-center justify-between text-xs text-rose-600">
                  <span>{t('locationLoadError')}</span>
                  <button
                    type="button"
                    onClick={() => wards.refetch()}
                    className="underline hover:text-rose-800 cursor-pointer"
                  >
                    {t('retry')}
                  </button>
                </div>
              )}
            </div>

            {/* Field 3: Địa chỉ chi tiết (Specific address) */}
            <div className="sm:col-span-2">
              <label
                htmlFor="venue-specific-address"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                {t('specificAddress')} *
              </label>
              <input
                id="venue-specific-address"
                required
                value={streetAddress}
                onChange={(e) => {
                  setStreetAddress(e.target.value);
                  setLocationError(null);
                }}
                placeholder={t('specificAddressPlaceholder')}
                className="w-full rounded border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Mô tả */}
            <div className="sm:col-span-2">
              <label
                htmlFor="venue-description"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                {t('description')}
              </label>
              <textarea
                id="venue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description')}
                rows={2}
                className="w-full rounded border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {locationError && (
              <div className="rounded bg-rose-50 p-3 text-xs font-semibold text-rose-700 sm:col-span-2">
                {locationError}
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={createVenue.isPending}
              className="cursor-pointer rounded bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60 transition"
            >
              {createVenue.isPending ? t('creatingVenue') : t('createNewVenue')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowVenueForm(false);
                setLocationError(null);
              }}
              className="cursor-pointer rounded border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Your Venues Section */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-950">{t('yourVenues')}</h2>
          {venues.data && venues.data.length > 0 && (
            <span className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {venues.data.length} venues
            </span>
          )}
        </div>

        {venues.isLoading ? (
          <div className="mt-4 p-8 text-center text-slate-500">{tCommon('loading')}</div>
        ) : venues.data && venues.data.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.data.map((venue) => (
              <PartnerVenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="font-bold text-slate-800">{t('noVenues')}</h3>
          </div>
        )}
      </section>
    </div>
  );
}
