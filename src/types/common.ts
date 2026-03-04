// ─── Agency Type ─────────────────────────────────────────────
export type AgencyType = 'BCRC' | 'BRC' | 'DGGPC' | 'GOVERNANCE_TEAM';

// ─── User Role ──────────────────────────────────────────────
export type UserRole =
  | 'CITIZEN'           // Citizen
  | 'ANONYMOUS'         // Anonymous reporter
  | 'BRC_OFFICER'       // BRC officer
  | 'BRC_MANAGER'       // BRC manager
  | 'BCRC_ADMIN'        // BCRC central admin
  | 'DGGPC_OFFICER'     // DGGPC officer
  | 'DGGPC_MANAGER'     // DGGPC manager
  | 'SYS_ADMIN';        // System admin

// ─── Administrative Region ──────────────────────────────────
export interface IRegion {
  code: string;         // 'TUN-01'
  nameFr: string;       // 'Tunis - Arrondissement 1'
  nameAr: string;       // 'تونس - الدائرة 1'
  governorat: string;   // 'TUN'
}

// ─── Localized Text ─────────────────────────────────────────
export interface ILocalizedText {
  fr: string;
  ar: string;
}

// ─── Pagination ─────────────────────────────────────────────
export interface IPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ─── API Common Response ────────────────────────────────────
export interface IApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: IPagination;
  timestamp: string;
}

export interface IApiError {
  success: false;
  error: {
    code: string;
    messageFr: string;
    messageAr: string;
  };
  timestamp: string;
}
