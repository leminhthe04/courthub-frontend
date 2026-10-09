import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';
import { SiteHeader } from '../components/site-header';

export const metadata: Metadata = {
  title: 'CourtHub — Đặt sân thể thao',
  description: 'Tìm và đặt sân thể thao theo thời gian thực.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          <SiteHeader />
          <main>{children}</main>
          <footer className="mx-auto mt-16 w-full max-w-7xl px-5 pb-8 text-sm text-slate-500">
            CourtHub · Đặt sân dễ dàng, chơi thể thao vui hơn.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
