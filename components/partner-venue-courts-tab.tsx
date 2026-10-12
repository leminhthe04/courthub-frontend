'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCreatePartnerCourt, useUpdatePartnerCourt } from '../hooks';
import { getLocalizedErrorMessage } from '../lib/formatters';
import { showToast } from '../lib/toast';
import type { Court, VenueDetail } from '../lib/types';

interface PartnerVenueCourtsTabProps {
  venue: VenueDetail;
}

export function PartnerVenueCourtsTab({ venue }: PartnerVenueCourtsTabProps) {
  const t = useTranslations('partnerDashboard');
  const tErrors = useTranslations('errors');

  const [newCourtName, setNewCourtName] = useState('');
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);

  const createCourt = useCreatePartnerCourt({
    onSuccess: () => {
      setNewCourtName('');
      showToast.success(t('courtCreated'));
    },
    onError: (err) => {
      showToast.error(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const updateCourt = useUpdatePartnerCourt({
    onSuccess: () => {
      setEditingCourtId(null);
      showToast.success(t('courtUpdated'));
    },
    onError: (err) => {
      showToast.error(getLocalizedErrorMessage(err, tErrors));
    },
  });

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

  const handleStartEdit = (court: Court) => {
    setEditingCourtId(court.id);
    setEditName(court.name);
    setEditActive(court.isActive);
  };

  const handleCancelEdit = () => {
    setEditingCourtId(null);
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

  return (
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
                          court.isActive ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-300'
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
  );
}
