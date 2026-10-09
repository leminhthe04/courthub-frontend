'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { AuthUser } from '../lib/types';

export function SiteHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ user: AuthUser }>('/auth/me'),
  });
  const logout = useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      router.push('/');
      router.refresh();
    },
  });
  const user = me.data?.user;

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-white">
            C
          </span>
          CourtHub
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Link href="/" className="hidden hover:text-emerald-600 sm:inline">
            Tìm sân
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-emerald-600">
                Lịch của tôi
              </Link>
              {user.role === 'PARTNER' && (
                <Link href="/partner" className="hidden hover:text-emerald-600 sm:inline">
                  Partner
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="hidden hover:text-emerald-600 sm:inline">
                  Admin
                </Link>
              )}
              <button
                onClick={() => logout.mutate()}
                className="rounded-full border border-slate-200 px-4 py-2 hover:border-emerald-400 hover:text-emerald-600"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-emerald-600">
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-slate-950 px-4 py-2 text-white hover:bg-emerald-600"
              >
                Tạo tài khoản
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
