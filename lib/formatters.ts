import { ApiError } from './http';

export function formatCurrency(amount: number, locale = 'vi'): string {
  const formattedNumber = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(amount);

  return locale === 'vi' ? `${formattedNumber}đ` : `${formattedNumber} VND`;
}

export function formatDateTime(value: string | Date, locale = 'vi'): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function formatDate(value: string | Date, locale = 'vi'): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function getLocalizedErrorMessage(
  error: unknown,
  tErrors: (code: string) => string,
): string {
  if (error instanceof ApiError && error.code) {
    try {
      const translated = tErrors(error.code);
      if (translated && !translated.startsWith('errors.')) {
        return translated;
      }
    } catch {
      // Fallback below
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return tErrors('default');
}
