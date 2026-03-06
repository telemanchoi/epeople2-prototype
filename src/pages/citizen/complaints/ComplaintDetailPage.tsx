import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Download,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ComplaintTypeBadge } from '@/components/common/ComplaintTypeBadge';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { Timeline } from '@/components/common/Timeline';
import type { TimelineItem, TimelineVariant } from '@/components/common/Timeline';
import { Skeleton } from '@/components/common/Skeleton';
import { useComplaint, useSubmitSatisfaction } from '@/hooks';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime } from '@/utils/date';
import type { ComplaintHistoryAction } from '@/types';

// Map history actions to timeline variants
const ACTION_VARIANT: Record<ComplaintHistoryAction, TimelineVariant> = {
  received: 'default',
  assigned: 'default',
  transferred: 'transfer',
  joint_process_started: 'default',
  deadline_extended: 'warning',
  processed: 'completed',
  completed: 'completed',
  closed: 'default',
  reopened: 'warning',
};

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tC } = useTranslation('complaint');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const { data: complaint, isLoading } = useComplaint(id);
  const satisfactionMutation = useSubmitSatisfaction();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [satisfactionSubmitted, setSatisfactionSubmitted] = useState(false);

  // Convert history to timeline items
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
      note: lang === 'ar' ? h.noteAr : h.noteFr,
      timestamp: formatDateTime(h.timestamp, lang),
      variant: ACTION_VARIANT[h.action] ?? 'default',
    }));
  }, [complaint?.history, lang]);

  // Determine if satisfaction rating is available
  const canRateSatisfaction = useMemo(() => {
    if (!complaint) return false;
    if (complaint.status !== 'completed') return false;
    if (complaint.satisfactionDetail) return false;
    if (!complaint.answer) return false;
    // Within 7 days of answer
    const answerDate = new Date(complaint.answer.answeredAt);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - answerDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 7;
  }, [complaint]);

  // Can appeal?
  const canAppeal = canRateSatisfaction;

  const handleSubmitSatisfaction = () => {
    if (!id || rating === 0) return;
    satisfactionMutation.mutate(
      { id, score: rating as 1 | 2 | 3 | 4 | 5 },
      {
        onSuccess: () => setSatisfactionSubmitted(true),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" count={3} />
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">{tCommon('errors.notFound')}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/citizen/complaints')}
        >
          {tCommon('buttons.back')}
        </Button>
      </div>
    );
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Back button + header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/citizen/complaints')}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer',
            isRtl && 'flex-row-reverse'
          )}
        >
          <BackIcon size={16} />
          {tCommon('buttons.back')}
        </button>

        <div
          className={cn(
            'flex items-start justify-between flex-wrap gap-3',
            isRtl && 'flex-row-reverse'
          )}
        >
          <div>
            <h1 className={cn('text-xl font-bold text-gray-900', isRtl ? 'text-right' : 'text-left')}>
              {tC('detail.title')}
            </h1>
            <p className={cn(
              'text-sm text-gray-500 font-mono mt-1',
              isRtl ? 'text-right' : 'text-left'
            )}>
              {complaint.id}
            </p>
          </div>
          <div className={cn('flex items-center gap-2 flex-wrap', isRtl && 'flex-row-reverse')}>
            <ComplaintTypeBadge type={complaint.type} showSla />
            <StatusBadge status={complaint.status} />
            <DeadlineBadge deadline={complaint.deadline} />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className={cn(
          'text-base font-semibold text-gray-900 mb-4',
          isRtl ? 'text-right' : 'text-left'
        )}>
          {tC('detail.info')}
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow
            label={tC('form.title')}
            value={lang === 'ar' ? complaint.titleAr : complaint.titleFr}
            isRtl={isRtl}
          />
          <InfoRow
            label={tC('table.agency')}
            value={
              lang === 'ar'
                ? complaint.assignedAgency.nameAr
                : complaint.assignedAgency.nameFr
            }
            isRtl={isRtl}
          />
          <InfoRow
            label={tC('form.categoryL1')}
            value={
              [
                lang === 'ar' ? complaint.categoryPath.l1.nameAr : complaint.categoryPath.l1.nameFr,
                lang === 'ar' ? complaint.categoryPath.l2.nameAr : complaint.categoryPath.l2.nameFr,
                complaint.categoryPath.l3
                  ? lang === 'ar'
                    ? complaint.categoryPath.l3.nameAr
                    : complaint.categoryPath.l3.nameFr
                  : '',
              ]
                .filter(Boolean)
                .join(' > ')
            }
            isRtl={isRtl}
          />
          <InfoRow
            label={tC('form.region')}
            value={complaint.regionCode}
            isRtl={isRtl}
          />
          {complaint.incidentDate && (
            <InfoRow
              label={tC('form.incidentDate')}
              value={formatDate(complaint.incidentDate, lang)}
              isRtl={isRtl}
            />
          )}
          <InfoRow
            label={tC('table.submittedAt')}
            value={formatDate(complaint.submittedAt, lang)}
            isRtl={isRtl}
          />
          <InfoRow
            label={tC('detail.deadline')}
            value={formatDate(complaint.deadline, lang)}
            isRtl={isRtl}
          />
          <InfoRow
            label={tC('detail.transferCount')}
            value={String(complaint.transferCount)}
            isRtl={isRtl}
            warning={complaint.transferCount >= 2}
          />
        </dl>

        {/* Content */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className={cn(
            'text-sm font-medium text-gray-500 uppercase mb-2',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {tC('form.content')}
          </p>
          <p className={cn(
            'text-sm text-gray-800 whitespace-pre-wrap leading-relaxed',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {lang === 'ar' ? complaint.contentAr : complaint.contentFr}
          </p>
        </div>
      </section>

      {/* Timeline */}
      {timelineItems.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className={cn(
            'text-base font-semibold text-gray-900 mb-4',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {tC('detail.timeline')}
          </h2>
          <Timeline items={timelineItems} />
        </section>
      )}

      {/* Attachments */}
      {complaint.attachments.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className={cn(
            'text-base font-semibold text-gray-900 mb-4',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {tC('detail.attachments')} ({complaint.attachments.length})
          </h2>
          <ul className="space-y-2">
            {complaint.attachments.map((att) => (
              <li
                key={att.id}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 rounded-lg',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <div className={cn(
                  'flex items-center gap-2 min-w-0',
                  isRtl && 'flex-row-reverse'
                )}>
                  <FileText size={16} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 truncate">
                    {att.originalName}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {(att.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  type="button"
                  className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors shrink-0 cursor-pointer"
                  aria-label={tCommon('buttons.download')}
                >
                  <Download size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Answer Section */}
      {complaint.answer && (
        <section className="bg-green-50 rounded-xl border border-green-200 p-6">
          <h2 className={cn(
            'text-base font-semibold text-green-900 mb-3',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {tC('detail.answer')}
          </h2>
          <p className={cn(
            'text-sm text-green-800 whitespace-pre-wrap leading-relaxed',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {lang === 'ar' ? complaint.answer.contentAr : complaint.answer.contentFr}
          </p>
          <p className={cn(
            'text-xs text-green-600 mt-3',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {formatDateTime(complaint.answer.answeredAt, lang)} — {complaint.answer.answeredBy}
          </p>
        </section>
      )}

      {/* Satisfaction Rating */}
      {canRateSatisfaction && !satisfactionSubmitted && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className={cn(
            'text-base font-semibold text-gray-900 mb-2',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {tC('detail.satisfaction')}
          </h2>
          <p className={cn(
            'text-sm text-gray-600 mb-4',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {tC('detail.satisfactionPrompt')}
          </p>

          <fieldset className="mb-4">
            <legend className="sr-only">{tC('detail.satisfaction')}</legend>
            <div className={cn(
              'flex items-center gap-1',
              isRtl && 'flex-row-reverse justify-end'
            )}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setRating(score)}
                  onMouseEnter={() => setHoverRating(score)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  aria-label={`${score}/5`}
                  aria-pressed={rating === score}
                >
                  <Star
                    size={28}
                    aria-hidden="true"
                    className={cn(
                      'transition-colors',
                      (hoverRating || rating) >= score
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <Button
            variant="primary"
            size="sm"
            disabled={rating === 0 || satisfactionMutation.isPending}
            loading={satisfactionMutation.isPending}
            onClick={handleSubmitSatisfaction}
          >
            {tCommon('buttons.submit')}
          </Button>
        </section>
      )}

      {/* Satisfaction already submitted */}
      {(satisfactionSubmitted || complaint.satisfactionDetail) && (
        <section className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <p className={cn(
            'text-sm font-medium text-amber-800',
            isRtl ? 'text-right' : 'text-left'
          )}>
            {tC('detail.satisfactionSubmitted')}
          </p>
          {complaint.satisfactionDetail && (
            <div
              className={cn('flex items-center gap-1 mt-2', isRtl && 'flex-row-reverse justify-end')}
              aria-label={`${complaint.satisfactionDetail.score}/5`}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <Star
                  key={score}
                  size={20}
                  aria-hidden="true"
                  className={cn(
                    score <= complaint.satisfactionDetail!.score
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Appeal Button */}
      {canAppeal && (
        <div className={cn(isRtl ? 'text-right' : 'text-left')}>
          <Button
            variant="outline"
            leftIcon={<AlertTriangle size={16} />}
            onClick={() => {
              // Simulation only - would navigate to appeal form
            }}
          >
            {tC('detail.appeal')}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            {tC('detail.appealHint')}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Info Row Helper ─────────────────────────────────────────
function InfoRow({
  label,
  value,
  isRtl,
  warning = false,
}: {
  label: string;
  value: string;
  isRtl: boolean;
  warning?: boolean;
}) {
  return (
    <div className={cn(isRtl ? 'text-right' : 'text-left')}>
      <dt className="text-sm font-medium text-gray-500 uppercase">{label}</dt>
      <dd
        className={cn(
          'text-sm text-gray-900 mt-0.5',
          warning && 'text-amber-700 font-semibold'
        )}
      >
        {value}
        {warning && (
          <AlertTriangle
            size={14}
            aria-hidden="true"
            className="inline-block ml-1 rtl:mr-1 rtl:ml-0 text-amber-600"
          />
        )}
      </dd>
    </div>
  );
}
