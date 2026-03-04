import { create } from 'zustand';
import type { IAuthSession, IUser, UserRole } from '@/types';

interface AuthState {
  session: IAuthSession | null;
  isAuthenticated: boolean;
  login: (session: IAuthSession) => void;
  logout: () => void;
  updateToken: (accessToken: string, expiresAt: string) => void;
  hasRole: (role: UserRole) => boolean;
  getUser: () => IUser | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isAuthenticated: false,
  login: (session) => set({ session, isAuthenticated: true }),
  logout: () => set({ session: null, isAuthenticated: false }),
  updateToken: (accessToken, expiresAt) =>
    set((state) => ({
      session: state.session
        ? { ...state.session, accessToken, expiresAt }
        : null,
    })),
  hasRole: (role) => get().session?.user.role === role,
  getUser: () => get().session?.user ?? null,
}));
