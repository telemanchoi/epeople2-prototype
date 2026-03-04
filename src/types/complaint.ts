import type { IAgency } from './agency';

// ─── Complaint Type (G-01 core design item) ─────────────────
// These 5 types are the foundation for SLA, workflow, and statistics
export type ComplaintType =
  | 'grievance'     // Grievance   (Réclamation / تظلم)    — 60 days
  | 'proposal'      // Proposal    (Suggestion / اقتراح)   — 30 days
  | 'inquiry'       // Inquiry     (Renseignement / استفسار)— 7 days
  | 'suggestion'    // Suggestion  (Doléance / ملاحظة)     — 30 days
  | 'report';       // Report      (Signalement / بلاغ)    — 15 days

// ─── Complaint Status ───────────────────────────────────────
export type ComplaintStatus =
  | 'received'      // Received
  | 'assigned'      // Assigned to agency
  | 'processing'    // In progress
  | 'completed'     // Processing completed
  | 'closed';       // Closed (satisfaction evaluated or period expired)

// ─── Complaint History Action Type ──────────────────────────
export type ComplaintHistoryAction =
  | 'received'              // Received
  | 'assigned'              // Assigned
  | 'transferred'           // Transferred
  | 'joint_process_started' // Joint processing started (G-03)
  | 'deadline_extended'     // Deadline extended (G-04)
  | 'processed'             // Response completed
  | 'completed'             // Processing completed
  | 'closed'                // Closed
  | 'reopened';             // Reopened via appeal

// ─── Complaint Category (3-level: large/medium/small) ───────
export interface ICategory {
  code: string;         // '010201'
  nameFr: string;
  nameAr: string;
  children?: ICategory[];
}

export interface ICategoryPath {
  l1: Pick<ICategory, 'code' | 'nameFr' | 'nameAr'>;
  l2: Pick<ICategory, 'code' | 'nameFr' | 'nameAr'>;
  l3?: Pick<ICategory, 'code' | 'nameFr' | 'nameAr'>;
}

// ─── Attachment ─────────────────────────────────────────────
export interface IAttachment {
  id: string;           // 'ATT-000001'
  filename: string;     // Server-stored filename
  originalName: string; // User-uploaded original filename
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;   // ISO 8601
}

// ─── Complaint History Entry ────────────────────────────────
export interface IComplaintHistory {
  id: string;
  action: ComplaintHistoryAction;
  actionLabelFr: string;        // Display label (FR)
  actionLabelAr: string;        // Display label (AR)
  fromAgency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  toAgency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  officer?: { id: string; name: string };
  reasonFr?: string;
  reasonAr?: string;
  noteFr?: string;
  noteAr?: string;
  timestamp: string;            // ISO 8601
}

// ─── Deadline Extension Request ─────────────────────────────
export interface IDeadlineExtensionRequest {
  id: string;
  complaintId: string;
  requestedAdditionalDays: number;
  reasonFr: string;
  reasonAr: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  currentDeadline: string;
  requestedDeadline: string;
}

// ─── Joint Processing (G-03) ────────────────────────────────
export interface IJointProcess {
  id: string;
  complaintId: string;
  leadAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  cooperatingAgencies: Array<{
    agency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
    opinionFr?: string;
    opinionAr?: string;
    submittedAt?: string;
    status: 'pending' | 'submitted';
  }>;
  startedAt: string;
}

// ─── Satisfaction Score ─────────────────────────────────────
export interface ISatisfactionScore {
  score: 1 | 2 | 3 | 4 | 5;
  commentFr?: string;
  commentAr?: string;
  submittedAt: string;
}

// ─── Complaint Ticket (lightweight for list view) ───────────
export interface IComplaintSummary {
  id: string;
  type: ComplaintType;
  titleFr: string;
  titleAr: string;
  status: ComplaintStatus;
  categoryPath: ICategoryPath;
  assignedAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  submittedAt: string;
  deadline: string;
  daysRemaining: number;        // Positive: days left / Negative: days overdue
  transferCount: number;        // Transfer count (G-02 control threshold)
  hasAttachments: boolean;
  satisfactionScore: number | null;
}

// ─── Complaint Ticket (full detail) ─────────────────────────
export interface IComplaint extends IComplaintSummary {
  contentFr: string;
  contentAr: string;
  regionCode: string;
  incidentDate?: string;
  citizenId: string;            // Masked for display
  isAnonymous: false;           // Complaints are always named (anonymous only for corruption reports)
  assignedOfficer?: {
    id: string;
    name: string;
    nameAr: string;
  };
  attachments: IAttachment[];
  history: IComplaintHistory[];
  answer?: {
    contentFr: string;
    contentAr: string;
    answeredAt: string;
    answeredBy: string;
  };
  extensionRequest?: IDeadlineExtensionRequest;
  jointProcess?: IJointProcess;
  satisfactionDetail?: ISatisfactionScore;
}
