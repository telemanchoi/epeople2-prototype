// ─── Common Types ───────────────────────────────────────────
export type { AgencyType, UserRole } from './common';
export type { IRegion, ILocalizedText, IPagination, IApiResponse, IApiError } from './common';

// ─── Agency Types ───────────────────────────────────────────
export type { ISLAConfig, IAgency, IAgencyPerformance } from './agency';

// ─── Complaint Types ────────────────────────────────────────
export type { ComplaintType, ComplaintStatus, ComplaintHistoryAction } from './complaint';
export type {
  ICategory,
  ICategoryPath,
  IAttachment,
  IComplaintHistory,
  IDeadlineExtensionRequest,
  IJointProcess,
  ISatisfactionScore,
  IComplaintSummary,
  IComplaint,
} from './complaint';

// ─── Corruption Report Types ────────────────────────────────
export type { CorruptionReportType, CorruptionReportStatus } from './report';
export type {
  ICorruptionReportSummary,
  ICorruptionReport,
  ICorruptionReportHistory,
} from './report';

// ─── Proposal Types ─────────────────────────────────────────
export type { ProposalStatus } from './proposal';
export type {
  IProposalReview,
  IImplementationUpdate,
  IProposalSummary,
  IProposal,
} from './proposal';

// ─── User Types ─────────────────────────────────────────────
export type { IUser, IAuthSession, ISubstituteConfig } from './user';

// ─── Statistics Types ───────────────────────────────────────
export type {
  IStatisticsOverview,
  ITrendDataPoint,
  ITypeDistribution,
  IRepeatedComplaintRecord,
  ILongOverdueComplaint,
} from './statistics';

// ─── Notification Types ─────────────────────────────────────
export type { NotificationType, INotification } from './notification';
