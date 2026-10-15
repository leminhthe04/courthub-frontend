'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { useCategories, useProvinces, useWards } from '../hooks';
import type { CreateVenueDto, VenueDetail } from '../lib/types';
import { SearchableSelect } from './searchable-select';

interface PartnerVenueFormProps {
  mode: 'create' | 'edit';
  venue?: VenueDetail;
  isSubmitting?: boolean;
  onSubmit: (dto: CreateVenueDto) => void;
  onCancel?: () => void;
}

function getWardLabel(type: string, name: string) {
  return type ? `${type} ${name}` : name;
}

export function PartnerVenueForm({
  mode,
  venue,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: PartnerVenueFormProps) {
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');
  const categories = useCategories();
  const provinces = useProvinces();
  const [name, setName] = useState(venue?.name ?? '');
  const [categoryId, setCategoryId] = useState(venue?.categoryId ?? '');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState(venue?.provinceCode ?? '');
  const [selectedWardCode, setSelectedWardCode] = useState(venue?.wardCode ?? '');
  const [streetAddress, setStreetAddress] = useState(venue?.address ?? '');
  const [description, setDescription] = useState(venue?.description ?? '');
  const [locationError, setLocationError] = useState<string | null>(null);
  const wards = useWards(selectedProvinceCode);
  const prefix = mode === 'create' ? 'create' : 'edit';

  useEffect(() => {
    if (mode !== 'edit' || !venue) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(venue.name);
    setCategoryId(venue.categoryId ?? '');
    setSelectedProvinceCode(venue.provinceCode);
    setSelectedWardCode(venue.wardCode);
    setStreetAddress(venue.address);
    setDescription(venue.description ?? '');
    setLocationError(null);
  }, [mode, venue]);

  const handleProvinceChange = (newProvinceCode: string) => {
    setSelectedProvinceCode(newProvinceCode);
    setSelectedWardCode('');
    setLocationError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryId) return;
    if (!selectedProvinceCode || !selectedWardCode || !streetAddress.trim()) {
      setLocationError(t('addressValidationWarning'));
      return;
    }

    const selectedProvince = provinces.data?.find((item) => item.code === selectedProvinceCode);
    const selectedWard = wards.data?.find((item) => item.code === selectedWardCode);
    if (!selectedProvince || !selectedWard || selectedWard.province_code !== selectedProvinceCode) {
      setLocationError(t('locationLoadError'));
      return;
    }

    onSubmit({
      name: name.trim(),
      categoryId,
      province: selectedProvince.name,
      provinceCode: selectedProvince.code,
      ward: getWardLabel(selectedWard.type, selectedWard.name),
      wardCode: selectedWard.code,
      address: streetAddress.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-black text-slate-900">
        {mode === 'create' ? t('createNewVenue') : t('venueDetailsTitle')}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${prefix}-venue-name`}
            className="mb-1 block text-xs font-bold text-slate-700"
          >
            {t('venueName')} *
          </label>
          <input
            id={`${prefix}-venue-name`}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('venueName')}
            className="w-full rounded border border-slate-200 px-4 py-2.5 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`${prefix}-venue-category`}
            className="mb-1 block text-xs font-bold text-slate-700"
          >
            {t('category')} *
          </label>
          <select
            id={`${prefix}-venue-category`}
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded border border-slate-200 bg-white px-4 py-2.5 focus:border-emerald-600 focus:outline-none"
          >
            <option value="" disabled>
              {categories.isLoading ? tCommon('loading') : t('selectCategoryPlaceholder')}
            </option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${prefix}-venue-province`}
            className="mb-1 block text-xs font-bold text-slate-700"
          >
            {t('provinceCity')} *
          </label>
          <SearchableSelect
            id={`${prefix}-venue-province`}
            value={selectedProvinceCode}
            onChange={handleProvinceChange}
            options={provinces.data?.map((item) => ({ value: item.code, label: item.name })) ?? []}
            placeholder={t('selectProvincePlaceholder')}
            searchPlaceholder={t('searchProvincePlaceholder')}
            noResultsText={t('noProvincesFound')}
            disabled={provinces.isLoading}
            isLoading={provinces.isLoading}
            loadingText={t('loadingProvinces')}
          />
          {provinces.isError && (
            <div className="mt-1 flex items-center justify-between text-rose-600">
              <span>{t('locationLoadError')}</span>
              <button type="button" onClick={() => provinces.refetch()} className="underline">
                {t('retry')}
              </button>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor={`${prefix}-venue-ward`}
            className="mb-1 block text-xs font-bold text-slate-700"
          >
            {t('wardDistrict')} *
          </label>
          <SearchableSelect
            id={`${prefix}-venue-ward`}
            value={selectedWardCode}
            onChange={(value) => {
              setSelectedWardCode(value);
              setLocationError(null);
            }}
            options={
              wards.data?.map((item) => ({
                value: item.code,
                label: getWardLabel(item.type, item.name),
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
            <div className="mt-1 flex items-center justify-between text-rose-600">
              <span>{t('locationLoadError')}</span>
              <button type="button" onClick={() => wards.refetch()} className="underline">
                {t('retry')}
              </button>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`${prefix}-venue-specific-address`}
            className="mb-1 block text-xs font-bold text-slate-700"
          >
            {t('specificAddress')} *
          </label>
          <input
            id={`${prefix}-venue-specific-address`}
            required
            value={streetAddress}
            onChange={(event) => {
              setStreetAddress(event.target.value);
              setLocationError(null);
            }}
            placeholder={t('specificAddressPlaceholder')}
            className="w-full rounded border border-slate-200 px-4 py-2.5 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`${prefix}-venue-description`}
            className="mb-1 block text-xs font-bold text-slate-700"
          >
            {t('description')}
          </label>
          <textarea
            id={`${prefix}-venue-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('description')}
            rows={2}
            className="w-full resize-y rounded border border-slate-200 px-4 py-2.5 focus:border-emerald-600 focus:outline-none"
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
          disabled={isSubmitting}
          className="cursor-pointer rounded bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {isSubmitting ? t('saving') : mode === 'create' ? t('createNewVenue') : t('save')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
