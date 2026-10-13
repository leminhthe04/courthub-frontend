'use client';

import { useTranslations } from 'next-intl';
import { Switch } from './ui/switch';
import type { AdminUser, Role } from '../lib/types';

interface AdminUsersTabProps {
  users: AdminUser[];
  currentUserId: string;
  isUpdatingStatus: boolean;
  isUpdatingRole: boolean;
  onStatusChange: (user: AdminUser, isActive: boolean) => void;
  onRoleChange: (user: AdminUser, role: Role) => void;
}

export function AdminUsersTab({
  users,
  currentUserId,
  isUpdatingStatus,
  isUpdatingRole,
  onStatusChange,
  onRoleChange,
}: AdminUsersTabProps) {
  const t = useTranslations('adminDashboard');

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-black text-slate-900">{t('usersTitle')}</h2>
      <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">{t('userName')}</th>
              <th className="px-5 py-4">{t('userContact')}</th>
              <th className="px-5 py-4">{t('userRole')}</th>
              <th className="px-5 py-4">{t('userStatus')}</th>
              <th className="px-5 py-4 text-right">{t('userActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{user.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{user.email || '—'}</p>
                    <p className="mt-1 text-xs">{user.phone || '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      disabled={isUpdatingRole}
                      onChange={(event) => onRoleChange(user, event.target.value as Role)}
                      className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-orange-500"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="PARTNER">PARTNER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        disabled={isSelf || isUpdatingStatus}
                        onCheckedChange={(checked) => onStatusChange(user, checked)}
                        aria-label={t('toggleUserStatus')}
                      />
                      <span
                        className={`text-xs font-bold ${
                          user.isActive ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {user.isActive ? t('activeStatus') : t('inactiveStatus')}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-slate-500">
                    {isSelf ? t('currentUser') : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
