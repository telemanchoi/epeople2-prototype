// ─── Auth ────────────────────────────────────────────────────
export { useLogin, useLogout } from './useAuth';

// ─── Complaints ──────────────────────────────────────────────
export {
  useComplaints,
  useComplaint,
  useSubmitComplaint,
  useUpdateComplaintStatus,
  useTransferComplaint,
  useExtendDeadline,
  useJointProcess,
  useSubmitSatisfaction,
  useDuplicateCheck,
} from './useComplaints';
export type { ComplaintFilters } from './useComplaints';

// ─── Reports ─────────────────────────────────────────────────
export {
  useSubmitReport,
  useTrackReport,
  useReports,
  useUpdateReportStatus,
} from './useReports';

// ─── Proposals ───────────────────────────────────────────────
export {
  useProposals,
  useProposal,
  useSubmitProposal,
  useToggleLike,
  useReviewProposal,
} from './useProposals';
export type { ProposalFilters } from './useProposals';

// ─── Statistics ──────────────────────────────────────────────
export {
  useStatisticsOverview,
  useTrend,
  useByType,
  useByAgency,
  useRepeatedComplaints,
  useLongOverdue,
} from './useStatistics';

// ─── Agencies ────────────────────────────────────────────────
export { useAgencies } from './useAgencies';

// ─── Categories ──────────────────────────────────────────────
export { useCategories } from './useCategories';

// ─── Notifications ───────────────────────────────────────────
export {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from './useNotifications';
