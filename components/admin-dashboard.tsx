'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useAdminBookings,
  useAdminCategories,
  useAdminVenues,
  useCreateCategory,
  useCurrentUser,
  useDeleteCategory,
  useReviewVenue,
  useUpdateCategory,
} from '../hooks';
import { formatCurrency, getLocalizedErrorMessage } from '../lib/formatters';
import type { Category } from '../lib/types';

export function AdminDashboard() {
  const locale = useLocale();
  const t = useTranslations('adminDashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const [activeTab, setActiveTab] = useState<'pending' | 'categories' | 'bookings'>('pending');

  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newActive, setNewActive] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editActive, setEditActive] = useState(true);

  const [actionError, setActionError] = useState<string | null>(null);

  const me = useCurrentUser();
  const isAdmin = me.user?.role === 'ADMIN';

  const venues = useAdminVenues(isAdmin);
  const bookings = useAdminBookings(isAdmin);
  const categories = useAdminCategories(isAdmin);
  const review = useReviewVenue();

  const createCategory = useCreateCategory({
    onSuccess: () => {
      setNewName('');
      setNewSlug('');
      setNewActive(true);
      setShowAddCategory(false);
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const updateCategory = useUpdateCategory({
    onSuccess: () => {
      setEditingId(null);
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const deleteCategory = useDeleteCategory({
    onSuccess: () => {
      setActionError(null);
    },
    onError: (err) => {
      setActionError(getLocalizedErrorMessage(err, tErrors));
    },
  });

  if (me.isLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-16 text-slate-500">{tCommon('loading')}</div>;
  }

  if (me.isError || !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-3 text-slate-500">
          {locale === 'vi'
            ? 'Khu vực này dành riêng cho tài khoản ADMIN.'
            : 'This area is restricted to administrator accounts.'}
        </p>
      </div>
    );
  }

  const pendingCount = venues.data?.filter((item) => item.status === 'PENDING').length ?? 0;
  const categoriesCount = categories.data?.length ?? 0;

  const handleStartEdit = (cat: Category) => {
    if ((cat.venueCount ?? 0) > 0) {
      setActionError(t('categoryInUseNotice'));
      return;
    }
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditActive(cat.isActive);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setActionError(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCategory.mutate({
      id,
      dto: {
        name: editName.trim(),
        slug: editSlug.trim() || undefined,
        isActive: editActive,
      },
    });
  };

  const handleDeleteCategory = (cat: Category) => {
    if ((cat.venueCount ?? 0) > 0) {
      setActionError(t('categoryInUseNotice'));
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(t('deleteCategoryConfirm'))) {
      return;
    }
    deleteCategory.mutate(cat.id);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate({
      name: newName.trim(),
      slug: newSlug.trim() || undefined,
      isActive: newActive,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Operations</p>
      <h1 className="mt-2 text-4xl font-black">{t('title')}</h1>
      <p className="mt-2 text-slate-600">{t('subtitle')}</p>

      {/* Metrics Row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Metric label="Venues" value={venues.data?.length ?? 0} />
        <Metric label={t('tabCategories')} value={categoriesCount} />
        <Metric label="Bookings" value={bookings.data?.length ?? 0} />
        <Metric label={tCommon('status.pending')} value={pendingCount} />
      </div>

      {/* Tab Navigation */}
      <div className="mt-10 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('pending');
            setActionError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition cursor-pointer ${
            activeTab === 'pending'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabPendingVenues')}
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('categories');
            setActionError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition cursor-pointer ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabCategories')}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-bold">
            {categoriesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('bookings');
            setActionError(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition cursor-pointer ${
            activeTab === 'bookings'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabBookings')}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-bold">
            {bookings.data?.length ?? 0}
          </span>
        </button>
      </div>

      {actionError && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {actionError}
        </div>
      )}

      {/* Tab 1: Pending Venues */}
      {activeTab === 'pending' && (
        <section className="mt-8">
          <h2 className="text-2xl font-black text-slate-900">{t('pendingVenues')}</h2>
          <div className="mt-4 grid gap-3">
            {pendingCount === 0 && (
              <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 rounded-lg">
                {t('noPendingVenues')}
              </div>
            )}
            {venues.data
              ?.filter((item) => item.status === 'PENDING')
              .map((venue) => (
                <article
                  key={venue.id}
                  className="flex flex-col justify-between gap-4 border border-slate-200 bg-white p-5 rounded-lg shadow-xs sm:flex-row sm:items-center"
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
                      onClick={() => review.mutate({ id: venue.id, action: 'reject' })}
                      disabled={review.isPending}
                      className="cursor-pointer border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 rounded hover:bg-rose-50 transition"
                    >
                      {t('reject')}
                    </button>
                    <button
                      type="button"
                      onClick={() => review.mutate({ id: venue.id, action: 'approve' })}
                      disabled={review.isPending}
                      className="cursor-pointer bg-emerald-600 px-4 py-2 text-sm font-bold text-white rounded hover:bg-emerald-700 transition"
                    >
                      {t('approve')}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      )}

      {/* Tab 2: Sport Categories Management */}
      {activeTab === 'categories' && (
        <section className="mt-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{t('categoriesTitle')}</h2>
              <p className="mt-1 text-xs text-slate-500">{t('categoriesSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddCategory((prev) => !prev);
                setActionError(null);
              }}
              className="cursor-pointer self-start sm:self-auto rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              {showAddCategory ? tCommon('cancel') : `+ ${t('addCategory')}`}
            </button>
          </div>

          {/* Add Category Form */}
          {showAddCategory && (
            <form
              onSubmit={handleCreateCategory}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900">{t('addCategory')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    {t('categoryName')}
                  </label>
                  <input
                    required
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="VD: Cầu lông"
                    className="mt-1.5 w-full rounded border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                {/* <div>
                  <label className="block text-xs font-bold text-slate-700">
                    {t('categorySlug')}
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder={t('categorySlugPlaceholder')}
                    className="mt-1.5 w-full rounded border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div> */}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={newActive}
                  onClick={() => setNewActive((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                    newActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      newActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700 select-none">
                  {t('categoryActive')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="cursor-pointer rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createCategory.isPending || !newName.trim()}
                  className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {createCategory.isPending ? tCommon('loading') : t('addCategory')}
                </button>
              </div>
            </form>
          )}

          {/* Categories Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {categoriesCount === 0 ? (
              <div className="p-8 text-center text-slate-500">{t('noCategories')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">{t('categoryName')}</th>
                      {/* <th className="px-5 py-3.5">{t('categorySlug')}</th> */}
                      <th className="px-5 py-3.5">{t('venueCount')}</th>
                      <th className="px-5 py-3.5">{t('categoryActive')}</th>
                      <th className="px-5 py-3.5 text-right">
                        {locale === 'vi' ? 'Thao tác' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.data?.map((cat) => {
                      const isEditing = editingId === cat.id;
                      const count = cat.venueCount ?? 0;
                      const isInUse = count > 0;

                      if (isEditing) {
                        return (
                          <tr key={cat.id} className="bg-emerald-50/30">
                            <td className="px-5 py-3">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-sm focus:border-emerald-600 focus:outline-none"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="text"
                                value={editSlug}
                                onChange={(e) => setEditSlug(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-sm focus:border-emerald-600 focus:outline-none"
                              />
                            </td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-500">
                              {count}
                            </td>
                            <td className="px-5 py-3">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={editActive}
                                onClick={() => setEditActive((prev) => !prev)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                  editActive ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                    editActive ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                >
                                  {tCommon('cancel')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(cat.id)}
                                  disabled={updateCategory.isPending || !editName.trim()}
                                  className="cursor-pointer rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                                >
                                  {updateCategory.isPending ? tCommon('loading') : tCommon('save')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{cat.name}</td>
                          {/* <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                            {cat.slug}
                          </td> */}
                          <td className="px-5 py-3.5">
                            {isInUse ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                {count}{' '}
                                {locale === 'vi' ? 'cụm sân' : count == 1 ? 'venue' : 'venues'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                                0
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-bold ${
                                cat.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {cat.isActive
                                ? locale === 'vi'
                                  ? 'Hoạt động'
                                  : 'Active'
                                : locale === 'vi'
                                  ? 'Tạm dừng'
                                  : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isInUse ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-400 cursor-not-allowed select-none"
                                  title={t('categoryInUseTooltip', { count })}
                                >
                                  <svg
                                    className="h-3.5 w-3.5 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                  {locale === 'vi' ? 'Đang dùng' : 'In use'}
                                </span>
                                <button
                                  type="button"
                                  disabled
                                  title={t('categoryInUseTooltip', { count })}
                                  className="rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-300 cursor-not-allowed"
                                >
                                  {tCommon('edit')}
                                </button>
                                <button
                                  type="button"
                                  disabled
                                  title={t('categoryInUseTooltip', { count })}
                                  className="rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-300 cursor-not-allowed"
                                >
                                  {tCommon('delete')}
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(cat)}
                                  className="cursor-pointer rounded border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                                >
                                  {tCommon('edit')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  disabled={deleteCategory.isPending}
                                  className="cursor-pointer rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60 transition"
                                >
                                  {tCommon('delete')}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: System Bookings */}
      {activeTab === 'bookings' && (
        <section className="mt-8">
          <h2 className="text-2xl font-black text-slate-900">{t('systemBookings')}</h2>
          <div className="mt-4 overflow-x-auto border border-slate-200 bg-white rounded-xl shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Venue / Court</th>
                  <th className="px-5 py-4">{locale === 'vi' ? 'Số điện thoại' : 'Phone'}</th>
                  <th className="px-5 py-4">{locale === 'vi' ? 'Trạng thái' : 'Status'}</th>
                  <th className="px-5 py-4">{locale === 'vi' ? 'Tổng tiền' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.data?.slice(0, 20).map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {booking.venueName} · {booking.courtName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{booking.contactPhone}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {formatCurrency(booking.totalAmount, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-xs">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
