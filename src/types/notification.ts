export type NotificationType =
  | 'deadline_approaching'      // Deadline approaching (D-3, D-1)
  | 'deadline_overdue'          // Deadline overdue
  | 'new_complaint_assigned'    // New complaint assigned
  | 'transfer_requested'        // Transfer request received
  | 'transfer_limit_warning'    // Transfer count warning (G-02)
  | 'extension_approved'        // Deadline extension approved (G-04)
  | 'extension_rejected'        // Deadline extension rejected
  | 'complaint_completed'       // Complaint processing completed (for citizen)
  | 'joint_process_request'     // Joint processing participation request (G-03)
  | 'proposal_reviewed';        // Proposal review result (G-05)

export interface INotification {
  id: string;
  type: NotificationType;
  titleFr: string;
  titleAr: string;
  messageFr: string;
  messageAr: string;
  relatedId?: string;           // Related complaint/report/proposal ID
  relatedType?: 'complaint' | 'report' | 'proposal';
  isRead: boolean;
  createdAt: string;
}
