import type { IAttachment } from './complaint';
import type { IAgency } from './agency';

// ─── Corruption Report Type ─────────────────────────────────
export type CorruptionReportType =
  | 'bribery'           // Bribery
  | 'embezzlement'      // Embezzlement
  | 'abuse_of_power'    // Abuse of power
  | 'nepotism'          // Nepotism
  | 'other';            // Other

// ─── Corruption Report Status ───────────────────────────────
export type CorruptionReportStatus =
  | 'received'          // Received
  | 'preliminary_review'// Preliminary review
  | 'under_investigation'// Under investigation
  | 'completed'         // Processing completed
  | 'dismissed';        // Dismissed (no grounds)

// ─── Corruption Report (list view) ──────────────────────────
export interface ICorruptionReportSummary {
  id: string;                   // 'RPT-2024-000018'
  type: CorruptionReportType;
  status: CorruptionReportStatus;
  targetAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  isAnonymous: boolean;
  // The following two fields are only visible to DGGPC roles.
  // Must be excluded from citizen responses.
  reporterMasked?: string;      // '***@***.tn' masked format
  anonymousToken?: string;      // Anonymous token (for tracking)
  submittedAt: string;
  trackingCode: string;         // Reporter tracking code
}

// ─── Corruption Report (full detail) ────────────────────────
export interface ICorruptionReport extends ICorruptionReportSummary {
  contentFr: string;
  contentAr: string;
  incidentDate?: string;
  locationFr?: string;
  locationAr?: string;
  attachments: IAttachment[];
  history: ICorruptionReportHistory[];
  result?: {
    summaryFr: string;
    summaryAr: string;
    completedAt: string;
  };
}

export interface ICorruptionReportHistory {
  id: string;
  action: string;
  actionLabelFr: string;
  actionLabelAr: string;
  officerId?: string;   // DGGPC staff
  noteFr?: string;
  noteAr?: string;
  timestamp: string;
}
