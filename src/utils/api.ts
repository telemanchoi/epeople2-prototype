import { useAuthStore } from '@/stores';

/**
 * Shared fetch wrapper that injects the Bearer token from authStore.
 * Drop-in replacement for `fetch()` in all hooks.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const session = useAuthStore.getState().session;
  const headers = new Headers(options.headers);

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  if (
    !headers.has('Content-Type') &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}
