import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  CalendarPlus,
  Users,
  Search,
  CheckCircle2,
  Paperclip,
  FileText,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ComplaintTypeBadge } from '@/components/common/ComplaintTypeBadge';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { Timeline } from '@/components/common/Timeline';
import type { TimelineItem, TimelineVariant } from '@/components/common/Timeline';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  useComplaint,
  useUpdateComplaintStatus,
  useTransferComplaint,
  useExtendDeadline,
  useJointProcess,
  useAgencies,
} from '@/hooks';
import { formatDate, formatDateTime } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { ComplaintStatus, IComplaintHistory } from '@/types';
import { addDays, parseISO, format } from 'date-fns';

const COMPLAINT_STATUSES: ComplaintStatus[] = [
  'received',
  'assigned',
  'processing',
  'completed',
  'closed',
];

// Map history action to timeline variant
function getTimelineVariant(action: IComplaintHistory['action']): TimelineVariant {
  switch (action) {
    case 'transferred':
      return 'transfer';
    case 'deadline_extended':
    case 'reopened':
      return 'warning';
    case 'completed':
    case 'closed':
      return 'completed';
    default:
      return 'default';
  }
}

export default function ComplaintProcessPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(['complaint', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const navigate = useNavigate();

  // Data hooks
  const { data: complaint, isLoading, isError } = useComplaint(id);
  const { data: agencies } = useAgencies();
  const updateStatus = useUpdateComplaintStatus();
  const transferComplaint = useTransferComplaint();
  const extendDeadline = useExtendDeadline();
  const jointProcess = useJointProcess();

  // UI state
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | ''>('');
  const [answerText, setAnswerText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAgencyId, setTransferAgencyId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Deadline extension modal state
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(7);
  const [extensionReason, setExtensionReason] = useState('');

  // Joint process confirmation
  const [showJointConfirm, setShowJointConfirm] = useState(false);

  // Complete confirmation
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Timeline items
  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!complaint?.history) return [];
    return complaint.history.map((h) => ({
      action: lang === 'ar' ? h.actionLabelAr : h.actionLabelFr,
      agencyName: h.toAgency
        ? lang === 'ar'
          ? h.toAgency.nameAr
          : h.toAgency.nameFr
        : h.fromAgency
          ? lang === 'ar'
            ? h.fromAgency.nameAr
            : h.fromAgency.nameFr
          : undefined,
      note:
        lang === 'ar'
          ? h.noteAr || h.reasonAr
          : h.noteFr || h.reasonFr,
      timestamp: formatDateTime(h.timestamp, lang),
      variant: getTimelineVariant(h.action),
    }));
  }, [complaint?.history, lang]);

  // Computed new deadline for extension
  const newDeadline = useMemo(() => {
    if (!complaint?.deadline) return '';
    try {
      const d = addDays(parseISO(complaint.deadline), extensionDays);
      return format(d, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }, [complaint?.deadline, extensionDays]);

  // Handle template selection
  const handleTemplateChange = useCallback(
    (template: string) => {
      setSelectedTemplate(template);
      switch (template) {
        case 'acknowledge':
          setAnswerText(
            lang === 'ar'
              ? 'نشكرك على شكواك. نؤكد استلامها وسنقوم بمعالجتها في أقرب وقت.'
              : lang === 'ko'
                ? '민원을 접수해 주셔서 감사합니다. 접수가 확인되었으며 빠른 시일 내에 처리하겠습니다.'
                : 'Nous accusons bonne réception de votre réclamation et vous confirmons qu\'elle sera traitée dans les meilleurs délais.'
          );
          break;
        case 'resolved':
          setAnswerText(
            lang === 'ar'
              ? 'نود إعلامك بأن شكواك قد تمت معالجتها بنجاح. نرجو أن يكون الحل مرضياً لك.'
              : lang === 'ko'
                ? '귀하의 민원이 성공적으로 처리되었음을 알려드립니다. 처리 결과에 만족하시기를 바랍니다.'
                : 'Nous avons le plaisir de vous informer que votre réclamation a été traitée avec succès. Nous espérons que la résolution vous satisfait.'
          );
          break;
        case 'needsInfo':
          setAnswerText(
            lang === 'ar'
              ? 'لمعالجة شكواك، نحتاج إلى معلومات إضافية. يرجى تزويدنا بالوثائق التالية:'
              : lang === 'ko'
                ? '민원을 처리하기 위해 추가 정보가 필요합니다. 다음 서류를 제출해 주시기 바랍니다:'
                : 'Pour traiter votre réclamation, nous avons besoin d\'informations complémentaires. Veuillez nous fournir les documents suivants :'
          );
          break;
        default:
          setAnswerText('');
      }
    },
    [lang]
  );

  // Handle status change
  const handleStatusChange = useCallback(() => {
    if (!complaint || !selectedStatus) return;
    updateStatus.mutate({
      id: complaint.id,
      status: selectedStatus,
      ...(answerText && { answerFr: answerText }),
    });
    setSelectedStatus('');
  }, [complaint, selectedStatus, answerText, updateStatus]);

  // Handle transfer submit
  const handleTransferSubmit = useCallback(() => {
    if (!complaint || !transferAgencyId || transferReason.length < 50) return;
    transferComplaint.mutate({
      id: complaint.id,
      targetAgencyId: transferAgencyId,
      reasonFr: transferReason,
    });
    setShowTransferModal(false);
    setTransferAgencyId('');
    setTransferReason('');
  }, [complaint, transferAgencyId, transferReason, transferComplaint]);

  // Handle deadline extension submit
  const handleExtensionSubmit = useCallback(() => {
    if (!complaint || !extensionReason) return;
    extendDeadline.mutate({
      id: complaint.id,
      requestedAdditionalDays: extensionDays,
      reasonFr: extensionReason,
    });
    setShowExtensionModal(false);
    setExtensionDays(7);
    setExtensionReason('');
  }, [complaint, extensionDays, extensionReason, extendDeadline]);

  // Handle joint process
  const handleJointProcess = useCallback(() => {
    if (!complaint) return;
    jointProcess.mutate({
      id: complaint.id,
      cooperatingAgencyIds: [],
      reasonFr: 'Joint process requested',
    });
    setShowJointConfirm(false);
  }, [complaint, jointProcess]);

  // Handle complete
  const handleComplete = useCallback(() => {
    if (!complaint) return;
    updateStatus.mutate({
      id: complaint.id,
      status: 'completed',
      ...(answerText && { answerFr: answerText }),
    });
    setShowCompleteConfirm(false);
  }, [complaint, answerText, updateStatus]);

  // File size formatter
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton variant="text" count={2} />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Skeleton variant="card" count={3} />
          </div>
          <div className="lg:col-span-2">
            <Skeleton variant="card" count={2} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !complaint) {
    return (
      <div className="p-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <EmptyState
          title={t('common:errors.notFound')}
          actionLabel={t('common:buttons.back')}
          onAction={() => navigate('/backoffice/worklist')}
        />
      </div>
    );
  }

  const canTransfer = complaint.transferCount < 3;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Back + header */}
      <div
        className={cn(
          'flex items-center gap-4',
          isRtl && 'flex-row-reverse'
        )}
      >
        <button
          type="button"
          onClick={() => navigate('/backoffice/worklist')}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          aria-label={t('common:buttons.back')}
        >
          <BackIcon size={20} />
        </button>
        <div className={cn('flex-1', isRtl ? 'text-right' : 'text-left')}>
          <h1 className="text-xl font-bold text-gray-900">
            {lang === 'ar' ? complaint.titleAr : complaint.titleFr}
          </h1>
          <div
            className={cn(
              'flex items-center gap-2 mt-1 flex-wrap',
              isRtl && 'flex-row-reverse'
            )}
          >
            <span className="font-mono text-xs text-gray-500">
              {complaint.id}
            </span>
            <ComplaintTypeBadge type={complaint.type} />
            <StatusBadge status={complaint.status} />
            <DeadlineBadge deadline={complaint.deadline} />
            {complaint.transferCount >= 2 && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  complaint.transferCount >= 3
                    ? 'text-red-600 font-bold'
                    : 'text-orange-600'
                )}
              >
                <AlertTriangle size={14} />
                {t('complaint:detail.transferCount')}: {complaint.transferCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN (60%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Complaint Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2
              className={cn(
                'text-base font-semibold text-gray-900 mb-4',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('complaint:process.complaintInfo')}
            </h2>

            {/* Category path */}
            {complaint.categoryPath && (
              <div className="mb-4">
                <span className="text-xs font-medium text-gray-500 block mb-1">
                  {t('complaint:process.categoryPath')}
                </span>
                <span className="text-sm text-gray-800">
                  {lang === 'ar'
                    ? [
                        complaint.categoryPath.l1.nameAr,
                        complaint.categoryPath.l2.nameAr,
                        complaint.categoryPath.l3?.nameAr,
                      ]
                        .filter(Boolean)
                        .join(' > ')
                    : [
                        complaint.categoryPath.l1.nameFr,
                        complaint.categoryPath.l2.nameFr,
                        complaint.categoryPath.l3?.nameFr,
                      ]
                        .filter(Boolean)
                        .join(' > ')}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-500 block mb-1">
                {t('complaint:process.content')}
              </span>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {lang === 'ar' ? complaint.contentAr : complaint.contentFr}
              </p>
            </div>

            {/* Submitted date */}
            <div className="text-xs text-gray-500">
              {t('complaint:table.submittedAt')}: {formatDate(complaint.submittedAt, lang)}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2
              className={cn(
                'text-base font-semibold text-gray-900 mb-3',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center gap-2',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <Paperclip size={16} />
                {t('complaint:detail.attachments')}
              </span>
            </h2>

            {complaint.attachments && complaint.attachments.length > 0 ? (
              <ul className="space-y-2">
                {complaint.attachments.map((att) => (
                  <li
                    key={att.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors',
                      isRtl && 'flex-row-reverse'
                    )}
                  >
                    <FileText
                      size={18}
                      className="text-gray-400 shrink-0"
                    />
                    <div className={cn('flex-1 min-w-0', isRtl ? 'text-right' : 'text-left')}>
                      <p className="text-sm text-gray-800 truncate">
                        {att.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(att.sizeBytes)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {t('common:empty.description')}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2
              className={cn(
                'text-base font-semibold text-gray-900 mb-4',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('complaint:detail.timeline')}
            </h2>
            <Timeline items={timelineItems} />
          </div>
        </div>

        {/* RIGHT COLUMN (40%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Change */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3
              className={cn(
                'text-sm font-semibold text-gray-900 mb-3',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('complaint:process.statusChange')}
            </h3>
            <div className="space-y-3">
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as ComplaintStatus | '')
                }
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">{t('common:form.selectOption')}</option>
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`complaint:statuses.${s}`)}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                disabled={!selectedStatus}
                onClick={handleStatusChange}
                loading={updateStatus.isPending}
                fullWidth
              >
                {t('common:buttons.confirm')}
              </Button>
            </div>
          </div>

          {/* Answer Editor */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3
              className={cn(
                'text-sm font-semibold text-gray-900 mb-3',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('complaint:process.answer')}
            </h3>

            {/* Template selector */}
            <div className="mb-3">
              <label
                className="block text-xs text-gray-500 mb-1"
                htmlFor="template-select"
              >
                {t('complaint:process.templateSelect')}
              </label>
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">{t('complaint:process.templateNone')}</option>
                <option value="acknowledge">
                  {t('complaint:process.templateAcknowledge')}
                </option>
                <option value="resolved">
                  {t('complaint:process.templateResolved')}
                </option>
                <option value="needsInfo">
                  {t('complaint:process.templateNeedsInfo')}
                </option>
              </select>
            </div>

            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={t('complaint:process.answerPlaceholder')}
              rows={6}
              className={cn(
                'w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:ring-primary-500 resize-y',
                isRtl && 'text-right'
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
            {/* Transfer */}
            <Button
              variant="outline"
              fullWidth
              leftIcon={<ArrowLeftRight size={16} />}
              onClick={() => setShowTransferModal(true)}
            >
              {t('complaint:process.transfer')}
            </Button>

            {/* Extend Deadline */}
            <Button
              variant="outline"
              fullWidth
              leftIcon={<CalendarPlus size={16} />}
              onClick={() => setShowExtensionModal(true)}
            >
              {t('complaint:process.extendDeadline')}
            </Button>

            {/* Joint Process */}
            <Button
              variant="outline"
              fullWidth
              leftIcon={<Users size={16} />}
              onClick={() => setShowJointConfirm(true)}
            >
              {t('complaint:process.jointProcess')}
            </Button>

            {/* Similar Cases */}
            <Button
              variant="ghost"
              fullWidth
              leftIcon={<Search size={16} />}
              onClick={() => {
                /* Placeholder - SidePanelDrawer in Phase 3 */
              }}
            >
              {t('complaint:process.similarCases')}
            </Button>

            {/* Complete */}
            <Button
              variant="primary"
              fullWidth
              leftIcon={<CheckCircle2 size={16} />}
              onClick={() => setShowCompleteConfirm(true)}
            >
              {t('complaint:process.complete')}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Transfer Modal ─────────────────────────────── */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={t('complaint:process.transfer')}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowTransferModal(false)}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleTransferSubmit}
              disabled={
                !canTransfer ||
                !transferAgencyId ||
                transferReason.length < 50
              }
              loading={transferComplaint.isPending}
            >
              {t('common:buttons.confirm')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* G-02: Transfer limit check */}
          {!canTransfer && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700 font-medium">
                {t('complaint:process.transferLimitReached')}
              </p>
            </div>
          )}

          {/* Target agency */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="transfer-agency"
            >
              {t('complaint:process.targetAgency')}
            </label>
            <select
              id="transfer-agency"
              value={transferAgencyId}
              onChange={(e) => setTransferAgencyId(e.target.value)}
              disabled={!canTransfer}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
            >
              <option value="">{t('complaint:process.selectAgency')}</option>
              {agencies?.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {lang === 'ar' ? agency.nameAr : agency.nameFr}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="transfer-reason"
            >
              {t('complaint:process.transferReasonLabel')}
            </label>
            <textarea
              id="transfer-reason"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              disabled={!canTransfer}
              rows={4}
              placeholder={t('complaint:process.transferReasonHint')}
              className={cn(
                'w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:ring-primary-500 resize-y disabled:bg-gray-100',
                isRtl && 'text-right'
              )}
            />
            <p
              className={cn(
                'mt-1 text-xs',
                transferReason.length < 50
                  ? 'text-orange-600'
                  : 'text-green-600'
              )}
            >
              {t('complaint:process.transferCharsCount', {
                count: transferReason.length,
              })}
            </p>
          </div>
        </div>
      </Modal>

      {/* ─── Deadline Extension Modal ───────────────────── */}
      <Modal
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
        title={t('complaint:process.extendDeadline')}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowExtensionModal(false)}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleExtensionSubmit}
              disabled={!extensionReason || extensionDays <= 0}
              loading={extendDeadline.isPending}
            >
              {t('common:buttons.confirm')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Current deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('complaint:process.currentDeadline')}
            </label>
            <p className="text-sm text-gray-800 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
              {complaint.deadline
                ? formatDate(complaint.deadline, lang)
                : '-'}
            </p>
          </div>

          {/* Additional days */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="extension-days"
            >
              {t('complaint:process.additionalDays')}
            </label>
            <input
              id="extension-days"
              type="number"
              min={1}
              max={60}
              value={extensionDays}
              onChange={(e) =>
                setExtensionDays(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* New deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('complaint:process.newDeadline')}
            </label>
            <p className="text-sm text-primary-700 bg-primary-50 rounded-md px-3 py-2 border border-primary-200 font-medium">
              {newDeadline || '-'}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="extension-reason"
            >
              {t('complaint:process.extensionReason')}
            </label>
            <textarea
              id="extension-reason"
              value={extensionReason}
              onChange={(e) => setExtensionReason(e.target.value)}
              rows={3}
              placeholder={t('complaint:process.extensionReasonPlaceholder')}
              className={cn(
                'w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:ring-primary-500 resize-y',
                isRtl && 'text-right'
              )}
            />
          </div>
        </div>
      </Modal>

      {/* ─── Joint Process Confirmation Modal ────────────── */}
      <Modal
        isOpen={showJointConfirm}
        onClose={() => setShowJointConfirm(false)}
        title={t('complaint:process.jointProcess')}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowJointConfirm(false)}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleJointProcess}
              loading={jointProcess.isPending}
            >
              {t('common:buttons.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          {t('complaint:process.jointProcessConfirm')}
        </p>
      </Modal>

      {/* ─── Complete Confirmation Modal ──────────────────── */}
      <Modal
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        title={t('complaint:process.complete')}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowCompleteConfirm(false)}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleComplete}
              loading={updateStatus.isPending}
            >
              {t('common:buttons.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          {t('complaint:process.completeConfirm')}
        </p>
      </Modal>
    </div>
  );
}
