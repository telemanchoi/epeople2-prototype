import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import type { IAuthSession, IApiResponse } from '@/types';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IAuthSession['user'];
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        throw new Error(`Login failed: ${res.status}`);
      }
      const json: IApiResponse<LoginResponse> = await res.json();
      return json.data;
    },
    onSuccess: (data) => {
      const session: IAuthSession = {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: new Date(
          Date.now() + data.expiresIn * 1000
        ).toISOString(),
      };
      login(session);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(`Logout failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      logout();
    },
  });
}
