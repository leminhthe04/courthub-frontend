'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useAdminBookings,
  useAdminCategories,
  useAdminPartnerRequests,
  useAdminUsers,
  useCreateCategory,
  useCurrentUser,
  useDeleteCategory,
  useReviewPartnerRequest,
  useUpdateAdminUserRole,
  useUpdateAdminUserStatus,
  useUpdateCategory,
} from '../hooks';
import { getLocalizedErrorMessage } from '../lib/formatters';
import { showConfirm } from '../lib/toast';
import type { AdminUser, Category, PartnerRequest, Role } from '../lib/types';
import { AdminBookingsTab } from './admin-bookings-tab';
import { AdminCategoriesTab } from './admin-categories-tab';
import { AdminPartnerRequestsTab } from './admin-partner-requests-tab';
import { AdminUsersTab } from './admin-users-tab';

export function AdminDashboard() {
  const locale = useLocale();
  const t = useTranslations('adminDashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const [activeTab, setActiveTab] = useState<
    'categories' | 'bookings' | 'users' | 'partnerRequests'
  >('users');

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

  const bookings = useAdminBookings(isAdmin);
  const categories = useAdminCategories(isAdmin);
  const users = useAdminUsers(isAdmin);
  const partnerRequests = useAdminPartnerRequests(isAdmin);

  const createCategory = useCreateCategory({
    onSuccess: () => {
      setNewName('');
      setNewSlug('');
      setNewActive(true);
      setShowAddCategory(false);
      setActionError(null);
    },
    onError: (err) => setActionError(getLocalizedErrorMessage(err, tErrors)),
  });

  const updateCategory = useUpdateCategory({
    onSuccess: () => {
      setEditingId(null);
      setActionError(null);
    },
    onError: (err) => setActionError(getLocalizedErrorMessage(err, tErrors)),
  });

  const deleteCategory = useDeleteCategory({
    onSuccess: () => setActionError(null),
    onError: (err) => setActionError(getLocalizedErrorMessage(err, tErrors)),
  });

  const updateUserStatus = useUpdateAdminUserStatus({
    onSuccess: () => setActionError(null),
    onError: (err) => setActionError(getLocalizedErrorMessage(err, tErrors)),
  });

  const updateUserRole = useUpdateAdminUserRole({
    onSuccess: () => setActionError(null),
    onError: (err) => setActionError(getLocalizedErrorMessage(err, tErrors)),
  });

  const reviewPartnerRequest = useReviewPartnerRequest({
    onSuccess: () => setActionError(null),
    onError: (err) => setActionError(getLocalizedErrorMessage(err, tErrors)),
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

  const bookingList = bookings.data ?? [];
  const categoryList = categories.data ?? [];
  const userList = users.data ?? [];
  const partnerRequestList = partnerRequests.data ?? [];
  const categoriesCount = categoryList.length;
  const pendingPartnerRequests = partnerRequestList.filter(
    (request) => request.status === 'PENDING',
  ).length;

  const handleStartEdit = (category: Category) => {
    if ((category.venueCount ?? 0) > 0) {
      setActionError(t('categoryInUseNotice'));
      return;
    }
    setEditingId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditActive(category.isActive);
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

  const handleDeleteCategory = (category: Category) => {
    if ((category.venueCount ?? 0) > 0) {
      setActionError(t('categoryInUseNotice'));
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(t('deleteCategoryConfirm'))) return;
    deleteCategory.mutate(category.id);
  };

  const handleCreateCategory = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate({
      name: newName.trim(),
      slug: newSlug.trim() || undefined,
      isActive: newActive,
    });
  };

  const clearActionError = () => setActionError(null);

  const handleUserStatusChange = (user: AdminUser, isActive: boolean) => {
    updateUserStatus.mutate({ id: user.id, isActive });
  };

  const handleUserRoleChange = (user: AdminUser, role: Role) => {
    updateUserRole.mutate({ id: user.id, role });
  };

  const handlePartnerRequestReview = async (
    request: PartnerRequest,
    action: 'approve' | 'reject',
  ) => {
    const result = await showConfirm({
      title:
        action === 'approve' ? t('approvePartnerRequestConfirm') : t('rejectPartnerRequestConfirm'),
      confirmButtonText: tCommon('confirm'),
      cancelButtonText: tCommon('cancel'),
    });
    if (!result.isConfirmed) return;
    reviewPartnerRequest.mutate({ id: request.id, action });
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Operations</p>
      <h1 className="mt-2 text-4xl font-black">{t('title')}</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Metric label={t('usersTitle')} value={userList.length} />
        <Metric label={t('tabCategories')} value={categoriesCount} />
        <Metric label="Bookings" value={bookingList.length} />
        <Metric label={t('partnerRequestsTitle')} value={pendingPartnerRequests} />
      </div>

      <div className="mt-10 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('categories');
            clearActionError();
          }}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabCategories')}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
            {categoriesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('bookings');
            clearActionError();
          }}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition ${
            activeTab === 'bookings'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabBookings')}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
            {bookingList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('users');
            clearActionError();
          }}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabUsers')}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
            {userList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('partnerRequests');
            clearActionError();
          }}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition ${
            activeTab === 'partnerRequests'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('tabPartnerRequests')}
          {pendingPartnerRequests > 0 && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {pendingPartnerRequests}
            </span>
          )}
        </button>
      </div>

      {actionError && (
        <div className="mt-6 rounded border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {actionError}
        </div>
      )}

      {activeTab === 'categories' && (
        <AdminCategoriesTab
          categories={categoryList}
          categoriesCount={categoriesCount}
          locale={locale}
          showAddCategory={showAddCategory}
          newName={newName}
          newActive={newActive}
          editingId={editingId}
          editName={editName}
          editSlug={editSlug}
          editActive={editActive}
          isCreating={createCategory.isPending}
          isUpdating={updateCategory.isPending}
          isDeleting={deleteCategory.isPending}
          onToggleAddCategory={() => {
            setShowAddCategory((current) => !current);
            clearActionError();
          }}
          onNewNameChange={setNewName}
          onNewActiveChange={() => setNewActive((current) => !current)}
          onCreateCategory={handleCreateCategory}
          onEditNameChange={setEditName}
          onEditSlugChange={setEditSlug}
          onEditActiveChange={() => setEditActive((current) => !current)}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {activeTab === 'bookings' && <AdminBookingsTab bookings={bookingList} />}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={userList}
          currentUserId={me.user?.userId ?? ''}
          isUpdatingStatus={updateUserStatus.isPending}
          isUpdatingRole={updateUserRole.isPending}
          onStatusChange={handleUserStatusChange}
          onRoleChange={handleUserRoleChange}
        />
      )}
      {activeTab === 'partnerRequests' && (
        <AdminPartnerRequestsTab
          requests={partnerRequestList}
          isReviewing={reviewPartnerRequest.isPending}
          onReview={handlePartnerRequestReview}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-xs">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
