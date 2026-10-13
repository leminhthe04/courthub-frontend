'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConfirmPasswordReset, useRequestPasswordReset } from '../hooks';
import { getLocalizedErrorMessage } from '../lib/formatters';
import { Link, useRouter } from '../lib/i18n/routing';
import { AuthCard } from './auth-form';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const mutation = useRequestPasswordReset({
    onSuccess: () => setSent(true),
  });

  return (
    <AuthCard title={t('forgotPasswordTitle')}>
      {sent ? (
        <div className="space-y-5">
          <p className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {t('passwordResetEmailSent')}
          </p>
          <Link
            href="/login"
            className="block text-center text-sm font-bold text-orange-600 hover:underline"
          >
            {t('loginNow')}
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(email.trim());
          }}
          className="space-y-4"
        >
          <label className="block text-sm font-semibold">
            {t('emailLabel')}
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
            />
          </label>
          {mutation.isError && (
            <p className="bg-rose-50 p-3 text-sm text-rose-700">
              {getLocalizedErrorMessage(mutation.error, tErrors)}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {mutation.isPending ? t('passwordResetSending') : t('sendPasswordResetEmail')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const mutation = useConfirmPasswordReset({
    onSuccess: () => setCompleted(true),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (!token) {
      setValidationError(t('invalidResetLink'));
      return;
    }
    if (password.length < 8) {
      setValidationError(t('validation.passwordMin'));
      return;
    }
    if (password !== confirmation) {
      setValidationError(t('validation.passwordMismatch'));
      return;
    }
    mutation.mutate({ token, newPassword: password });
  };

  return (
    <AuthCard title={t('resetPasswordTitle')}>
      {completed ? (
        <div className="space-y-5">
          <p className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {t('passwordResetCompleted')}
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full rounded bg-slate-950 px-4 py-3 font-bold text-white hover:bg-orange-600"
          >
            {t('loginButton')}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">
            {t('newPassword')}
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
            />
          </label>
          <label className="block text-sm font-semibold">
            {t('confirmPassword')}
            <input
              required
              minLength={8}
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded border border-slate-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
            />
          </label>
          {(validationError || mutation.isError) && (
            <p className="bg-rose-50 p-3 text-sm text-rose-700">
              {validationError ?? getLocalizedErrorMessage(mutation.error, tErrors)}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {mutation.isPending ? t('passwordResetSaving') : t('resetPasswordButton')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
