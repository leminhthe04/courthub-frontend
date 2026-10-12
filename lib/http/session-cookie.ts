const SESSION_COOKIE_NAME = 'has_session';
const SESSION_STORAGE_KEY = 'has_session';

/**
 * Returns true if the client has a session hint cookie or localStorage flag.
 * Used for optimistic UI and preventing unauthenticated auth/me requests.
 */
export function getHasSessionHint(): boolean {
  if (typeof window === 'undefined') return false;

  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`),
  );
  const cookieVal = cookieMatch ? cookieMatch[1] : null;

  let storageVal: string | null = null;
  try {
    storageVal = window.localStorage?.getItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage access might be restricted in some sandboxed iframes
  }

  return cookieVal === '1' || storageVal === '1';
}

export const SESSION_CHANGE_EVENT = 'courthub:session-change';

/**
 * Sets the non-HttpOnly companion session hint cookie and localStorage flag.
 * Lifetime is 7 days to match backend refresh token validity.
 */
export function setSessionHint(): void {
  if (typeof window === 'undefined') return;

  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  try {
    window.localStorage?.setItem(SESSION_STORAGE_KEY, '1');
  } catch {
    // Ignore storage quota or access errors
  }
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

/**
 * Clears the session hint cookie and localStorage flag.
 */
export function clearSessionHint(): void {
  if (typeof window === 'undefined') return;

  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  try {
    window.localStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage quota or access errors
  }
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function subscribeSessionChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', callback);
  window.addEventListener(SESSION_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SESSION_CHANGE_EVENT, callback);
  };
}
