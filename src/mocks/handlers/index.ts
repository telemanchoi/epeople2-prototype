import { authHandlers } from './auth';
import { complaintHandlers } from './complaints';
import { reportHandlers } from './reports';
import { proposalHandlers } from './proposals';
import { statisticsHandlers } from './statistics';
import { agencyHandlers } from './agencies';
import { categoryHandlers } from './categories';
import { attachmentHandlers } from './attachments';
import { notificationHandlers } from './notifications';

export const handlers = [
  ...authHandlers,
  ...complaintHandlers,
  ...reportHandlers,
  ...proposalHandlers,
  ...statisticsHandlers,
  ...agencyHandlers,
  ...categoryHandlers,
  ...attachmentHandlers,
  ...notificationHandlers,
];
