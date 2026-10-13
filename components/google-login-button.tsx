'use client';

import { useTranslations } from 'next-intl';
import { API_BASE_URL } from '../lib/http';

export function GoogleLoginButton() {
  const t = useTranslations('auth');

  return (
    <a
      href={`${API_BASE_URL}/auth/google`}
      className="flex w-full items-center justify-center rounded border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-800 shadow-md transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
    >
      <svg
        className="mr-2 h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-0.5 0 48 48"
        aria-hidden="true"
      >
        <title>Google</title>
        <g stroke="none" fill="none" fillRule="evenodd">
          <path
            d="M9.827 24c0-1.524.253-2.986.705-4.356l-7.909-6.04A23.8 23.8 0 0 0 .214 24c0 3.737.867 7.261 2.407 10.388l7.904-6.051A14.1 14.1 0 0 1 9.827 24"
            fill="#FBBC05"
          />
          <path
            d="M23.714 10.133c3.311 0 6.302 1.174 8.652 3.094L39.202 6.4C35.036 2.773 29.695.533 23.714.533 14.427.533 6.445 5.844 2.623 13.604l7.909 6.04c1.822-5.532 7.017-9.511 13.182-9.511"
            fill="#EB4335"
          />
          <path
            d="M23.714 37.867c-6.165 0-11.36-3.979-13.182-9.511l-7.909 6.039c3.822 7.761 11.804 13.072 21.091 13.072 5.732 0 11.204-2.035 15.311-5.849l-7.507-5.803c-2.119 1.335-4.786 2.052-7.804 2.052"
            fill="#34A853"
          />
          <path
            d="M46.145 24c0-1.387-.214-2.88-.534-4.267H23.714V28.8h12.604c-.63 3.092-2.346 5.468-4.8 7.014l7.507 5.803C43.339 37.614 46.145 31.649 46.145 24"
            fill="#4285F4"
          />
        </g>
      </svg>
      <span>{t('continueWithGoogle')}</span>
    </a>
  );
}
