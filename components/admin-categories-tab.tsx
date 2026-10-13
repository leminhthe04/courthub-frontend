'use client';

import { useTranslations } from 'next-intl';
import type { Category } from '../lib/types';
import { Switch } from './ui/switch';

interface AdminCategoriesTabProps {
  categories: Category[];
  categoriesCount: number;
  locale: string;
  showAddCategory: boolean;
  newName: string;
  newActive: boolean;
  editingId: string | null;
  editName: string;
  editSlug: string;
  editActive: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onToggleAddCategory: () => void;
  onNewNameChange: (value: string) => void;
  onNewActiveChange: () => void;
  onCreateCategory: (event: React.FormEvent) => void;
  onEditNameChange: (value: string) => void;
  onEditSlugChange: (value: string) => void;
  onEditActiveChange: () => void;
  onStartEdit: (category: Category) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDeleteCategory: (category: Category) => void;
}

export function AdminCategoriesTab({
  categories,
  categoriesCount,
  locale,
  showAddCategory,
  newName,
  newActive,
  editingId,
  editName,
  editSlug,
  editActive,
  isCreating,
  isUpdating,
  isDeleting,
  onToggleAddCategory,
  onNewNameChange,
  onNewActiveChange,
  onCreateCategory,
  onEditNameChange,
  onEditSlugChange,
  onEditActiveChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteCategory,
}: AdminCategoriesTabProps) {
  const t = useTranslations('adminDashboard');
  const tCommon = useTranslations('common');

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t('categoriesTitle')}</h2>
        </div>
        <button
          type="button"
          onClick={onToggleAddCategory}
          className="cursor-pointer self-start rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
        >
          {showAddCategory ? tCommon('cancel') : `+ ${t('addCategory')}`}
        </button>
      </div>

      {showAddCategory && (
        <form
          onSubmit={onCreateCategory}
          className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900">{t('addCategory')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">{t('categoryName')}</label>
              <input
                required
                type="text"
                value={newName}
                onChange={(event) => onNewNameChange(event.target.value)}
                placeholder="VD: Cầu lông"
                className="mt-1.5 w-full rounded border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={newActive}
              onCheckedChange={onNewActiveChange}
              aria-label={t('categoryActive')}
            />
            <span className="select-none text-xs font-semibold text-slate-700">
              {t('categoryActive')}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onToggleAddCategory}
              className="cursor-pointer rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreating || !newName.trim()}
              className="cursor-pointer rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isCreating ? tCommon('loading') : t('addCategory')}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        {categoriesCount === 0 ? (
          <div className="p-8 text-center text-slate-500">{t('noCategories')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">{t('categoryName')}</th>
                  <th className="px-5 py-3.5">{t('venueCount')}</th>
                  <th className="px-5 py-3.5">{t('categoryActive')}</th>
                  <th className="px-5 py-3.5 text-right">
                    {locale === 'vi' ? 'Thao tác' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => {
                  const isEditing = editingId === category.id;
                  const count = category.venueCount ?? 0;
                  const isInUse = count > 0;

                  if (isEditing) {
                    return (
                      <tr key={category.id} className="bg-emerald-50/30">
                        <td className="px-5 py-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(event) => onEditNameChange(event.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-sm focus:border-emerald-600 focus:outline-none"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(event) => onEditSlugChange(event.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-sm focus:border-emerald-600 focus:outline-none"
                          />
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-500">{count}</td>
                        <td className="px-5 py-3">
                          <Switch
                            checked={editActive}
                            onCheckedChange={onEditActiveChange}
                            aria-label={t('categoryActive')}
                            className="h-5 w-9 data-[state=checked]:bg-orange-600"
                          />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={onCancelEdit}
                              className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              {tCommon('cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onSaveEdit(category.id)}
                              disabled={isUpdating || !editName.trim()}
                              className="cursor-pointer rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {isUpdating ? tCommon('loading') : tCommon('save')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={category.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{category.name}</td>
                      <td className="px-5 py-3.5">
                        {isInUse ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {count} {locale === 'vi' ? 'cụm sân' : count === 1 ? 'venue' : 'venues'}
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
                            category.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {category.isActive
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
                              className="inline-flex cursor-not-allowed select-none items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-400"
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
                              className="cursor-not-allowed rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-300"
                            >
                              {tCommon('edit')}
                            </button>
                            <button
                              type="button"
                              disabled
                              title={t('categoryInUseTooltip', { count })}
                              className="cursor-not-allowed rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-300"
                            >
                              {tCommon('delete')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onStartEdit(category)}
                              className="cursor-pointer rounded border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                            >
                              {tCommon('edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCategory(category)}
                              disabled={isDeleting}
                              className="cursor-pointer rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
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
  );
}
