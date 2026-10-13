'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCurrentUser, useLogin, useRegister } from '../hooks';
import { getLocalizedErrorMessage } from '../lib/formatters';
import { Link, useRouter } from '../lib/i18n/routing';
import { Role } from '@/lib/types';
import { GoogleLoginButton } from './google-login-button';

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null;
}

const RouteMap: Map<Role, string> = new Map([
  ['PARTNER', '/partner'],
  ['ADMIN', '/admin'],
  ['CUSTOMER', '/'],
]);

export function LoginForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user) {
      const destination = redirectUrl || RouteMap.get(user.role) || '/';
      router.replace(destination);
    }
  }, [user, isLoading, router, redirectUrl]);

  const loginSchema = z.object({
    identifier: z.string().min(3, t('validation.identifierRequired')),
    password: z.string().min(8, t('validation.passwordMin')),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const mutation = useLogin({
    onSuccess: (result) => {
      const destination = redirectUrl || RouteMap.get(result.user.role) || '/';
      router.push(destination);
      router.refresh();
    },
  });

  return (
    <AuthCard title={t('loginTitle')} subtitle={t('loginSubtitle')}>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
        <label className="block text-sm font-semibold">
          {t('identifierLabel')}
          <input
            {...form.register('identifier')}
            placeholder={t('identifierPlaceholder')}
            className="mt-2 w-full border rounded  border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.identifier?.message} />
        </label>
        <label className="block text-sm font-semibold">
          {t('passwordLabel')}
          <input
            type="password"
            {...form.register('password')}
            placeholder={t('passwordPlaceholder')}
            className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.password?.message} />
        </label>
        {mutation.isError && (
          <p className="bg-rose-50 p-3 text-sm text-rose-700">
            {getLocalizedErrorMessage(mutation.error, tErrors)}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full cursor-pointer rounded bg-slate-950 px-4 py-3 font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {mutation.isPending ? t('loggingIn') : t('loginButton')}
        </button>
        <GoogleLoginButton />
        <p className="text-center text-sm text-slate-500">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-bold text-emerald-600 hover:underline">
            {t('registerNow')}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

export function RegisterForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();

  const registerSchema = z
    .object({
      fullName: z.string().min(2, t('validation.nameMin')),
      email: z.string().email(t('validation.invalidEmail')).or(z.literal('')),
      phone: z
        .string()
        .regex(/^\+?[0-9\s().-]{8,24}$/, t('validation.invalidPhone'))
        .or(z.literal('')),
      password: z.string().min(8, t('validation.passwordMin')),
    })
    .refine((value) => value.email || value.phone, {
      message: t('validation.emailOrPhoneRequired'),
      path: ['email'],
    });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '' },
  });

  const mutation = useRegister({
    onSuccess: () => {
      router.push('/');
      router.refresh();
    },
  });

  return (
    <AuthCard title={t('registerTitle')} subtitle={t('registerSubtitle')}>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
        <label className="block text-sm font-semibold">
          {t('fullNameLabel')}
          <input
            {...form.register('fullName')}
            placeholder={t('fullNamePlaceholder')}
            className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.fullName?.message} />
        </label>
        <label className="block text-sm font-semibold">
          {t('emailLabel')}
          <input
            {...form.register('email')}
            type="email"
            placeholder="you@example.com"
            className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.email?.message} />
        </label>
        <label className="block text-sm font-semibold">
          {t('phoneLabel')}
          <input
            {...form.register('phone')}
            placeholder="0901234567"
            className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.phone?.message} />
        </label>
        <label className="block text-sm font-semibold">
          {t('passwordLabel')}
          <input
            type="password"
            {...form.register('password')}
            placeholder={t('passwordPlaceholder')}
            className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
          />
          <FieldError message={form.formState.errors.password?.message} />
        </label>
        {mutation.isError && (
          <p className="bg-rose-50 p-3 text-sm text-rose-700">
            {getLocalizedErrorMessage(mutation.error, tErrors)}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full cursor-pointer rounded bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {mutation.isPending ? t('registering') : t('registerButton')}
        </button>
        <p className="text-center text-sm text-slate-500">
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">
            {t('loginNow')}
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
      <div className="border border-slate-200 rounded bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">CourtHub</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-slate-500">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
