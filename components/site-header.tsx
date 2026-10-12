'use client';

import { useTranslations } from 'next-intl';
import { useCurrentUser, useLogout } from '../hooks';
import { Link, useRouter } from '../lib/i18n/routing';
import { User } from 'lucide-react';
import { CourtHubLogo } from './courthub-logo';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader() {
  const t = useTranslations('header');
  const router = useRouter();
  const { user } = useCurrentUser();
  const logout = useLogout({
    onSuccess: () => {
      router.push('/');
      router.refresh();
    },
  });

  const isPartner = user?.role === 'PARTNER';
  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';
  const isGuest = !user;

  const homeHref = isPartner ? '/partner' : isAdmin ? '/admin' : '/';

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link
          href={homeHref}
          className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950"
        >
          <CourtHubLogo />
          CourtHub
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            {(isGuest || isCustomer) && (
              <Link href="/" className="hidden hover:text-emerald-600 sm:inline">
                {t('findCourts')}
              </Link>
            )}
            {user ? (
              <>
                <Link
                  href="/profile"
                  title={t('profile')}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-700 transition hover:bg-slate-100 hover:text-emerald-600"
                >
                  <User className="h-5 w-5" />
                  {user.fullName && (
                    <span className="hidden max-w-[120px] truncate text-xs font-bold sm:inline">
                      {user.fullName}
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="hidden hover:text-emerald-600 sm:inline">
                    {t('admin')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="rounded cursor-pointer border border-slate-200 px-4 py-2 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-60"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-emerald-600">
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="bg-slate-950 px-4 py-2 text-white hover:bg-emerald-600"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </nav>
          <div className="border-l border-slate-200 pl-3">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
