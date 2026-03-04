import type { UserRole } from './common';
import type { IAgency } from './agency';

export interface IUser {
  id: string;                           // 'USR-000042'
  username: string;                     // 'officer@brc.tn'
  name: string;                         // Latin name
  nameAr: string;                       // Arabic name
  role: UserRole;
  agency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  isActive: boolean;
  lastLoginAt?: string;
  // Passwords, tokens, and other sensitive info must NEVER be included in client types
}

// Session info maintained on client after login
export interface IAuthSession {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Substitute processing configuration (G-09)
export interface ISubstituteConfig {
  officerId: string;
  substituteId: string;
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
}
