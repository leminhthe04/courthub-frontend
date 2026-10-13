'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ShieldCheck, User, KeyRound } from 'lucide-react';
import {
  useCurrentUser,
  useUpdateProfile,
  useChangePassword,
  useMyPartnerRequest,
  useSubmitPartnerRequest,
} from '../hooks';
import { getLocalizedErrorMessage } from '../lib/formatters';
import { Link } from '../lib/i18n/routing';

export function ProfileManager() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const { user, isLoading } = useCurrentUser();

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password Form state
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  const [partnerMessage, setPartnerMessage] = useState('');
  const [partnerRequestSuccess, setPartnerRequestSuccess] = useState(false);
  const [partnerRequestError, setPartnerRequestError] = useState<string | null>(null);

  const partnerRequest = useMyPartnerRequest(user?.role === 'CUSTOMER');
  const submitPartnerRequest = useSubmitPartnerRequest({
    onSuccess: () => {
      setPartnerRequestSuccess(true);
      setPartnerRequestError(null);
    },
    onError: (err) => {
      setPartnerRequestSuccess(false);
      setPartnerRequestError(getLocalizedErrorMessage(err, tErrors));
    },
  });

  // Sync initial user data
  if (user && !isFormInitialized) {
    setFullName(user.fullName ?? '');
    setEmail(user.email ?? '');
    setPhone(user.phone ?? '');
    setIsFormInitialized(true);
  }

  const updateProfileMutation = useUpdateProfile({
    onSuccess: () => {
      setProfileSuccessMsg(true);
      setProfileErrorMsg(null);
      setTimeout(() => setProfileSuccessMsg(false), 4000);
    },
    onError: (err) => {
      setProfileSuccessMsg(false);
      setProfileErrorMsg(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const changePasswordMutation = useChangePassword({
    onSuccess: () => {
      setPasswordSuccessMsg(true);
      setPasswordErrorMsg(null);
      setTimeout(() => setPasswordSuccessMsg(false), 4000);
    },
    onError: (err) => {
      setPasswordSuccessMsg(false);
      setPasswordErrorMsg(getLocalizedErrorMessage(err, tErrors));
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(false);
    setProfileErrorMsg(null);

    updateProfileMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(false);
    setPasswordErrorMsg(null);
    changePasswordMutation.mutate();
  };

  const handlePartnerRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPartnerRequestSuccess(false);
    setPartnerRequestError(null);
    submitPartnerRequest.mutate(partnerMessage.trim() || undefined);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16 text-center text-slate-500">
        {tCommon('loading')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-3 text-slate-500">{tCommon('loading')}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex bg-slate-950 px-5 py-3 font-bold text-white hover:bg-emerald-600"
        >
          {tCommon('confirm')}
        </Link>
      </div>
    );
  }

  const roleBadgeColor =
    user.role === 'ADMIN'
      ? 'bg-rose-100 text-rose-800'
      : user.role === 'PARTNER'
        ? 'bg-indigo-100 text-indigo-800'
        : 'bg-emerald-100 text-emerald-800';

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      {/* Header Profile Banner */}
      <div className="rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-black text-white shadow-sm">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                  {user.fullName || t('title')}
                </h1>
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-bold uppercase ${roleBadgeColor}`}
                >
                  {user.role}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {user.email || user.phone || t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Card 1: Personal Information */}
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="rounded bg-emerald-50 p-2 text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{t('personalInfo')}</h2>
              <p className="text-xs text-slate-500">{t('subtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
            {profileSuccessMsg && (
              <div className="rounded bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <Check
                  className="mr-1 inline-block h-3.5 w-3.5"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                {t('profileUpdated')}
              </div>
            )}
            {profileErrorMsg && (
              <div className="rounded bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                {profileErrorMsg}
              </div>
            )}

            <div>
              <label htmlFor="profile-fullName" className="block text-xs font-bold text-slate-700">
                {t('fullName')} *
              </label>
              <input
                id="profile-fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-xs font-bold text-slate-700">
                {t('email')}
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 w-full rounded border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="profile-phone" className="block text-xs font-bold text-slate-700">
                {t('phone')}
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="mt-1.5 w-full rounded border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full cursor-pointer rounded bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </form>
        </section>

        {user.role === 'CUSTOMER' && (
          <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="rounded bg-indigo-50 p-2 text-indigo-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{t('partnerRequestTitle')}</h2>
                <p className="text-xs text-slate-500">{t('partnerRequestSubtitle')}</p>
              </div>
            </div>

            <form onSubmit={handlePartnerRequestSubmit} className="mt-5 space-y-4">
              {partnerRequest.data && (
                <div className="rounded bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  {partnerRequest.data.status === 'PENDING' && t('partnerRequestPending')}
                  {partnerRequest.data.status === 'APPROVED' && t('partnerRequestApproved')}
                  {partnerRequest.data.status === 'REJECTED' && t('partnerRequestRejected')}
                </div>
              )}
              {partnerRequestSuccess && (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  <Check className="mr-1 inline-block h-3.5 w-3.5" strokeWidth={3} />
                  {t('partnerRequestSubmitted')}
                </div>
              )}
              {partnerRequestError && (
                <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                  {partnerRequestError}
                </div>
              )}
              <div>
                <label
                  htmlFor="partner-request-message"
                  className="block text-xs font-bold text-slate-700"
                >
                  {t('partnerRequestMessage')}
                </label>
                <textarea
                  id="partner-request-message"
                  value={partnerMessage}
                  onChange={(e) => setPartnerMessage(e.target.value)}
                  placeholder={t('partnerRequestMessagePlaceholder')}
                  rows={4}
                  maxLength={2000}
                  disabled={
                    partnerRequest.data?.status === 'PENDING' ||
                    partnerRequest.data?.status === 'APPROVED'
                  }
                  className="mt-1.5 w-full rounded border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={
                  submitPartnerRequest.isPending ||
                  partnerRequest.data?.status === 'PENDING' ||
                  partnerRequest.data?.status === 'APPROVED'
                }
                className="w-full cursor-pointer rounded bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitPartnerRequest.isPending
                  ? t('partnerRequestSubmitting')
                  : t('submitPartnerRequest')}
              </button>
            </form>
          </section>
        )}

        {/* Card 2: Security & Change Password */}
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="rounded bg-amber-50 p-2 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{t('security')}</h2>
              <p className="text-xs text-slate-500">{t('securitySubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            {passwordSuccessMsg && (
              <div className="rounded bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <Check
                  className="mr-1 inline-block h-3.5 w-3.5"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                {t('passwordResetEmailSent')}
              </div>
            )}
            {passwordErrorMsg && (
              <div className="rounded bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                {passwordErrorMsg}
              </div>
            )}

            <p className="text-sm leading-6 text-slate-600">{t('passwordResetDescription')}</p>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {changePasswordMutation.isPending
                    ? t('passwordResetSending')
                    : t('sendPasswordResetEmail')}
                </span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
