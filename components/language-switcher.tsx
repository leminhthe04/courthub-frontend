'use client';

import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '../lib/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchLocale(nextLocale: 'vi' | 'en') {
    if (nextLocale === locale) return;

    const queryString = searchParams.toString();
    const currentRoute = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(currentRoute, { locale: nextLocale });
  }

  return (
    <div
      aria-label="Language selector"
      className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold"
    >
      <button
        type="button"
        onClick={() => switchLocale('vi')}
        className={`cursor-pointer rounded px-2 py-1 transition-all ${
          locale === 'vi'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-pressed={locale === 'vi'}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={`cursor-pointer rounded px-2 py-1 transition-all ${
          locale === 'en'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  );
}
