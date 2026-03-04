import type { ComplaintType } from './complaint';
import type { IAgency } from './agency';

// ─── Dashboard KPI Summary ──────────────────────────────────
export interface IStatisticsOverview {
  totalReceived: number;
  totalCompleted: number;
  completionRate: number;
  avgProcessingDays: number;
  overdueCount: number;
  avgSatisfactionScore: number;
  changeVsLastPeriod: {
    received: number;         // % change (+12.3 or -5.2)
    completionRate: number;
  };
}

// ─── Period Trend ───────────────────────────────────────────
export interface ITrendDataPoint {
  period: string;             // '2024-03' (monthly) or '2024-03-01' (daily)
  received: number;
  completed: number;
  overdue: number;
}

// ─── Type Distribution ──────────────────────────────────────
export interface ITypeDistribution {
  type: ComplaintType;
  count: number;
  percentage: number;
  avgProcessingDays: number;
}

// ─── Repeated Complaint Analysis (G-06) ─────────────────────
export interface IRepeatedComplaintRecord {
  citizenId: string;          // Masked ('***masked***')
  repeatCount: number;
  categories: string[];       // Main category list
  lastComplaintAt: string;
  totalUnresolved: number;
}

// ─── Long Overdue Complaints (G-06) ─────────────────────────
export interface ILongOverdueComplaint {
  complaintId: string;
  type: ComplaintType;
  titleFr: string;
  daysOverdue: number;
  assignedAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  assignedOfficer?: { name: string };
}
