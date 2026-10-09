'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiFetch, ApiError } from '../lib/api';
import type { AuthUser } from '../lib/types';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Nhập email hoặc số điện thoại'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không hợp lệ').or(z.literal('')),
    phone: z
      .string()
      .regex(/^\+?[0-9\s().-]{8,24}$/, 'Số điện thoại không hợp lệ')
      .or(z.literal('')),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  })
  .refine((value) => value.email || value.phone, {
    message: 'Cần email hoặc số điện thoại',
    path: ['email'],
  });

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null;
}

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof loginSchema>) =>
      apiFetch<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (result) => {
      queryClient.setQueryData(['me'], result);
      router.push('/');
      router.refresh();
    },
  });

  return (
    <AuthCard title="Chào mừng trở lại" subtitle="Đăng nhập để lưu và theo dõi lịch sử booking.">
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
        <label className="block text-sm font-semibold">
          Email hoặc số điện thoại
          <input
            {...form.register('identifier')}
            placeholder="you@example.com hoặc 090..."
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.identifier?.message} />
        </label>
        <label className="block text-sm font-semibold">
          Mật khẩu
          <input
            type="password"
            {...form.register('password')}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.password?.message} />
        </label>
        {mutation.isError && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {mutation.error instanceof ApiError ? mutation.error.message : 'Đăng nhập thất bại'}
          </p>
        )}
        <button
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {mutation.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-bold text-emerald-600">
            Đăng ký
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '' },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof registerSchema>) =>
      apiFetch<{ user: AuthUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          email: values.email || undefined,
          phone: values.phone || undefined,
        }),
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(['me'], result);
      router.push('/');
      router.refresh();
    },
  });

  return (
    <AuthCard
      title="Tạo tài khoản CUSTOMER"
      subtitle="Dùng email hoặc số điện thoại để đăng nhập lần sau."
    >
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
        <label className="block text-sm font-semibold">
          Họ và tên
          <input
            {...form.register('fullName')}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.fullName?.message} />
        </label>
        <label className="block text-sm font-semibold">
          Email <span className="font-normal text-slate-400">(tùy chọn nếu có số điện thoại)</span>
          <input
            {...form.register('email')}
            type="email"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.email?.message} />
        </label>
        <label className="block text-sm font-semibold">
          Số điện thoại <span className="font-normal text-slate-400">(tùy chọn nếu có email)</span>
          <input
            {...form.register('phone')}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.phone?.message} />
        </label>
        <label className="block text-sm font-semibold">
          Mật khẩu
          <input
            type="password"
            {...form.register('password')}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.password?.message} />
        </label>
        {mutation.isError && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {mutation.error instanceof ApiError ? mutation.error.message : 'Đăng ký thất bại'}
          </p>
        )}
        <button
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {mutation.isPending ? 'Đang tạo…' : 'Tạo tài khoản'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-bold text-emerald-600">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">CourtHub</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-slate-500">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
