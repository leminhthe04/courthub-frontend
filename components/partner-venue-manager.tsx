'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useCreatePartnerCourt,
  useCreatePricingRule,
  useCurrentUser,
  useDeletePricingRule,
  usePartnerVenues,
  useUpdatePartnerCourt,
} from '../hooks';
import { formatCurrency, getLocalizedErrorMessage } from '../lib/formatters';
import { Link } from '../lib/i18n/routing';
import type { Court } from '../lib/types';

interface PartnerVenueManagerProps {
  venueId: string;
}

export function PartnerVenueManager({ venueId }: PartnerVenueManagerProps) {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const [activeTab, setActiveTab] = useState<'courts' | 'pricing'>('courts');

  // Court state
  const [newCourtName, setNewCourtName] = useState('');
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Pricing rule state
  const [newRuleStartTime, setNewRuleStartTime] = useState('00:00');
  const [newRuleEndTime, setNewRuleEndTime] = useState('00:00');
  const [newRuleRate, setNewRuleRate] = useState('150000');

  const [actionError, setActionError] = useState<string | null>(null);

  const me = useCurrentUser();
  const isPartner = me.user?.role === 'PARTNER';

  const { data: venues, isLoading } = usePartnerVenues(isPartner);
  const venue = venues?.find((v) => v.id === venueId);

  const createCourt = useCreatePartnerCourt({
    onSuccess: () => {
      setNewCourtName('');
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const updateCourt = useUpdatePartnerCourt({
    onSuccess: () => {
      setEditingCourtId(null);
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const createPricingRule = useCreatePricingRule({
    onSuccess: () => {
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const deletePricingRule = useDeletePricingRule({
    onSuccess: () => {
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getLocalizedErrorMessage(err, tErrors));
    },
  });

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

  const handleStartEdit = (court: Court) => {
    setEditingCourtId(court.id);
    setEditName(court.name);
    setEditActive(court.isActive);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingCourtId(null);
    setActionError(null);
  };

  const handleSaveEdit = (courtId: string) => {
    if (!editName.trim()) return;

    updateCourt.mutate({
      courtId,
      dto: {
        name: editName.trim(),
        isActive: editActive,
      },
    });
  };

  const handleToggleActive = (court: Court) => {
    updateCourt.mutate({
      courtId: court.id,
      dto: {
        isActive: !court.isActive,
      },
    });
  };

  const handleCreateCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName.trim()) return;

    createCourt.mutate({
      venueId: venue.id,
      dto: {
        name: newCourtName.trim(),
      },
    });
  };

  const handleAddPricingRule = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(newRuleRate);
    if (!newRuleStartTime || !newRuleEndTime || Number.isNaN(rate) || rate < 0) return;

    createPricingRule.mutate({
      venueId: venue.id,
      dto: {
        startTime: newRuleStartTime,
        endTime: newRuleEndTime,
        hourlyRate: rate,
      },
    });
  };

  const handleDeletePricingRule = (ruleId: string) => {
    deletePricingRule.mutate({
      venueId: venue.id,
      ruleId,
    });
  };

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
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
              {venue.address}, {venue.city}
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
          onClick={() => {
            setActiveTab('courts');
            setActionError(null);
          }}
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
          onClick={() => {
            setActiveTab('pricing');
            setActionError(null);
          }}
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
      </div>

      {actionError && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-xs">
          {actionError}
        </div>
      )}

      {/* Tab 1: Courts Management */}
      {activeTab === 'courts' && (
        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left Column: Add New Court Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">{t('addNewCourt')}</h2>

              <form onSubmit={handleCreateCourt} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">{t('courtName')}</label>
                  <input
                    required
                    type="text"
                    value={newCourtName}
                    onChange={(e) => setNewCourtName(e.target.value)}
                    placeholder={t('courtNamePlaceholder')}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createCourt.isPending || !newCourtName.trim()}
                  className="w-full cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {createCourt.isPending ? t('addingCourt') : `+ ${t('addNewCourt')}`}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Existing Courts List */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-black text-slate-900">
                  {t('existingCourts', { count: venue.courts.length })}
                </h2>
              </div>

              {venue.courts.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-12 text-center">
                  <p className="font-semibold text-slate-700">{t('noCourtsInVenue')}</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {venue.courts.map((court) => {
                    const isEditing = editingCourtId === court.id;

                    if (isEditing) {
                      return (
                        <div
                          key={court.id}
                          className="rounded-lg border border-emerald-400 bg-emerald-50/40 p-4 space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              {t('courtName')}
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={editActive}
                              onClick={() => setEditActive((prev) => !prev)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                                editActive ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className="sr-only">
                                {editActive ? t('activeStatus') : t('inactiveStatus')}
                              </span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  editActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              onClick={() => setEditActive((prev) => !prev)}
                              className="cursor-pointer text-xs font-semibold text-slate-800 select-none"
                            >
                              {editActive ? t('activeStatus') : t('inactiveStatus')}
                            </span>
                          </div>

                          <div className="flex justify-end gap-2 pt-1 border-t border-emerald-200">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={updateCourt.isPending}
                              className="cursor-pointer rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                              {t('cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(court.id)}
                              disabled={updateCourt.isPending || !editName.trim()}
                              className="cursor-pointer rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                            >
                              {updateCourt.isPending ? t('saving') : t('save')}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={court.id}
                        className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4.5 transition hover:border-slate-300 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`inline-block h-3 w-3 rounded-full ${
                              court.isActive
                                ? 'bg-emerald-500 ring-4 ring-emerald-50'
                                : 'bg-slate-300'
                            }`}
                          />
                          <h3 className="font-bold text-slate-900">{court.name}</h3>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          <span
                            className={`rounded px-2.5 py-1 text-xs font-bold ${
                              court.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {court.isActive ? t('activeStatus') : t('inactiveStatus')}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(court)}
                            disabled={updateCourt.isPending}
                            className="cursor-pointer rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            title={t('toggleStatus')}
                          >
                            {court.isActive ? t('inactiveStatus') : t('activeStatus')}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(court)}
                            className="cursor-pointer rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                          >
                            {t('edit')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Pricing Slots Management */}
      {activeTab === 'pricing' && (
        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left Column: Add Pricing Rule Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">{t('addPricingRule')}</h2>

              <form onSubmit={handleAddPricingRule} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      {t('startTime')}
                    </label>
                    <input
                      required
                      type="time"
                      step="1800"
                      value={newRuleStartTime}
                      onChange={(e) => setNewRuleStartTime(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">{t('endTime')}</label>
                    <input
                      required
                      type="time"
                      step="1800"
                      value={newRuleEndTime}
                      onChange={(e) => setNewRuleEndTime(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    {t('hourlyRate')}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1000"
                    value={newRuleRate}
                    onChange={(e) => setNewRuleRate(e.target.value)}
                    placeholder="150000"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createPricingRule.isPending}
                  className="w-full cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {createPricingRule.isPending
                    ? t('addingPricingRule')
                    : `+ ${t('addPricingRule')}`}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Pricing Rules List */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900">{t('pricingRulesTitle')}</h2>
              </div>

              {pricingRules.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-12 text-center">
                  <p className="font-semibold text-slate-600">{t('noPricingRules')}</p>
                </div>
              ) : (
                <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                  {pricingRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 transition hover:bg-slate-50/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 font-bold text-emerald-800">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                          </svg>
                        </span>
                        <div>
                          <span className="font-bold text-slate-900">
                            {rule.startTime.slice(0, 5)} - {rule.endTime.slice(0, 5)}
                          </span>
                          <p className="text-xs text-slate-500">{t('timeRange')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-base font-black text-emerald-700">
                          {formatCurrency(rule.hourlyRate, locale)}/giờ
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeletePricingRule(rule.id)}
                          disabled={deletePricingRule.isPending}
                          className="cursor-pointer rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60 transition"
                        >
                          {t('deletePricingRule')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
