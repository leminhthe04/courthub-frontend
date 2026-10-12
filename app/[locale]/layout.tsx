import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import '../globals.css';
import { Providers } from '../../components/providers';
import { SiteHeader } from '../../components/site-header';
import { routing } from '../../lib/i18n/routing';

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-manrope',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'vi' | 'en')) {
    return { title: 'CourtHub' };
  }
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: t('title'),
    description: t('tagline'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'vi' | 'en')) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <html lang={locale}>
      <body className={`${manrope.variable} min-h-screen bg-slate-50 text-slate-900`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SiteHeader />
            <main>{children}</main>
            <footer className="mx-auto mt-16 w-full max-w-7xl px-5 pb-8 text-sm text-slate-500">
              {t('footer')}
            </footer>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
