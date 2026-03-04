import type { ICategoryPath, IAttachment } from './complaint';
import type { IAgency } from './agency';

// ─── Proposal Status ────────────────────────────────────────
export type ProposalStatus =
  | 'pending'           // Awaiting review
  | 'under_review'      // Under review
  | 'accepted'          // Accepted
  | 'rejected'          // Rejected
  | 'implemented';      // Implementation completed

// ─── Review Result ──────────────────────────────────────────
export interface IProposalReview {
  result: 'accepted' | 'rejected';
  reviewCommentFr: string;
  reviewCommentAr: string;
  reviewedAt: string;
  reviewedBy: string;
  implementationPlanFr?: string;
  implementationPlanAr?: string;
}

// ─── Implementation Update ──────────────────────────────────
export interface IImplementationUpdate {
  id: string;
  contentFr: string;
  contentAr: string;
  progress: number;     // 0~100 (%)
  updatedAt: string;
}

// ─── Citizen Proposal (list view) ───────────────────────────
export interface IProposalSummary {
  id: string;
  titleFr: string;
  titleAr: string;
  status: ProposalStatus;
  categoryPath: ICategoryPath;
  assignedAgency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  likeCount: number;
  isLikedByMe: boolean;         // Whether current logged-in user has liked
  submittedAt: string;
  reviewResult?: Pick<IProposalReview, 'result' | 'reviewedAt'>;
}

// ─── Citizen Proposal (full detail) ─────────────────────────
export interface IProposal extends IProposalSummary {
  contentFr: string;
  contentAr: string;
  attachments: IAttachment[];
  review?: IProposalReview;
  implementationUpdates: IImplementationUpdate[];
}
