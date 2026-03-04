import type { AgencyType } from './common';

// ─── SLA Configuration (processing deadline per complaint type) ──
// Unit: hours
export interface ISLAConfig {
  grievance: number;    // Grievance: 1440 hours (60 days)
  proposal: number;     // Proposal:  720 hours (30 days)
  inquiry: number;      // Inquiry:   168 hours (7 days)
  suggestion: number;   // Suggestion: 720 hours (30 days)
  report: number;       // Report:    360 hours (15 days)
}

// ─── Agency ─────────────────────────────────────────────────
export interface IAgency {
  id: string;                   // 'BRC-ENV-TUN-001'
  nameFr: string;
  nameAr: string;
  type: AgencyType;
  parentId: string | null;      // Parent agency (BCRC -> BRC hierarchy)
  regionCode: string;
  isActive: boolean;
  contactEmail: string;
  slaConfig: ISLAConfig;        // Agency-specific SLA per complaint type
}

// ─── Agency Performance (for statistics) ────────────────────
export interface IAgencyPerformance {
  agency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  received: number;
  completed: number;
  completionRate: number;       // Percentage (0~100)
  avgProcessingDays: number;
  slaComplianceRate: number;    // SLA compliance rate (%)
  satisfactionScore: number;    // Average satisfaction (1~5)
  transferCount: number;        // Number of transfer occurrences
  overdueCount: number;         // Number of overdue cases
}
