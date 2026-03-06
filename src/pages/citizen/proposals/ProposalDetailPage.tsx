import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  CheckCircle2,
  XCircle,
  FileText,
  LogIn,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { useProposal, useToggleLike } from '@/hooks';
import { useAuthStore } from '@/stores';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import type { ProposalStatus } from '@/types';

const STATUS_BADGE_VARIANT: Record<
  ProposalStatus,
  'info' | 'warning' | 'success' | 'error' | 'neutral'
> = {
  pending: 'neutral',
  under_review: 'warning',
  accepted: 'success',
  rejected: 'error',
  implemented: 'info',
};

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(['proposal', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: proposal, isLoading } = useProposal(id);
  const toggleLike = useToggleLike();

  const handleLike = () => {
    if (!isAuthenticated || !id) return;
    toggleLike.mutate(id);
  };

  if (isLoading) {
    return (
      <div
        className="max-w-3xl mx-auto p-6 space-y-6"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Skeleton variant="text" count={2} />
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div
        className="max-w-3xl mx-auto p-6 text-center"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <p className="text-gray-500">{t('common:errors.notFound')}</p>
      </div>
    );
  }

  const title = lang === 'ar' ? proposal.titleAr : proposal.titleFr;
  const content = lang === 'ar' ? proposal.contentAr : proposal.contentFr;
  const categoryL1 =
    lang === 'ar'
      ? proposal.categoryPath?.l1?.nameAr
      : proposal.categoryPath?.l1?.nameFr;
  const categoryL2 =
    lang === 'ar'
      ? proposal.categoryPath?.l2?.nameAr
      : proposal.categoryPath?.l2?.nameFr;

  const statusVariant = STATUS_BADGE_VARIANT[proposal.status];
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  // Latest implementation progress
  const latestProgress =
    proposal.implementationUpdates && proposal.implementationUpdates.length > 0
      ? proposal.implementationUpdates[proposal.implementationUpdates.length - 1]
          .progress
      : 0;

  return (
    <div
      className="max-w-3xl mx-auto p-6 space-y-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/citizen/proposals')}
        className={cn(
          'flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors',
          isRtl && 'flex-row-reverse'
        )}
      >
        <BackArrow size={16} />
        <span>{t('common:buttons.back')}</span>
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div
          className={cn(
            'flex items-start justify-between gap-3',
            isRtl && 'flex-row-reverse'
          )}
        >
          <h1
            className={cn(
              'text-xl font-bold text-gray-900 flex-1',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {title}
          </h1>
          <Badge variant={statusVariant}>
            {t(`proposal:statuses.${proposal.status}`)}
          </Badge>
        </div>

        {/* Meta info */}
        <div
          className={cn(
            'flex items-center gap-4 text-sm text-gray-500 flex-wrap',
            isRtl && 'flex-row-reverse'
          )}
        >
          <span>
            {t('proposal:detail.submittedAt')}: {formatDate(proposal.submittedAt, lang)}
          </span>
        </div>

        {/* Category path */}
        {categoryL1 && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs text-gray-500',
              isRtl && 'flex-row-reverse'
            )}
          >
            <span className="bg-gray-100 rounded-full px-2 py-0.5">
              {categoryL1}
            </span>
            {categoryL2 && (
              <>
                <span className="text-gray-300">/</span>
                <span className="bg-gray-100 rounded-full px-2 py-0.5">
                  {categoryL2}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Proposal Content */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </section>

      {/* Attachments */}
      {proposal.attachments && proposal.attachments.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2
            className={cn(
              'text-sm font-semibold text-gray-700 mb-3',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {t('proposal:form.attachments')}
          </h2>
          <ul className="space-y-2">
            {proposal.attachments.map((att) => (
              <li
                key={att.id}
                className={cn(
                  'flex items-center gap-2 text-sm text-gray-600',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <FileText size={16} className="text-gray-400 shrink-0" />
                <span>{att.originalName}</span>
                <span className="text-xs text-gray-400">
                  ({(att.sizeBytes / 1024).toFixed(0)} KB)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* G-05 Like Button */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={handleLike}
                disabled={toggleLike.isPending}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all',
                  proposal.isLikedByMe
                    ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                    : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-red-200 hover:text-red-500'
                )}
              >
                <Heart
                  size={24}
                  fill={proposal.isLikedByMe ? 'currentColor' : 'none'}
                />
                <span>
                  {proposal.isLikedByMe
                    ? t('proposal:detail.unlike')
                    : t('proposal:detail.like')}
                </span>
              </button>
              <span className="text-sm text-gray-500">
                {t('proposal:detail.likes', { count: proposal.likeCount })}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 text-sm text-gray-500',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <LogIn size={16} className="text-gray-400" />
                <span>{t('proposal:detail.loginToLike')}</span>
              </div>
              <span className="text-sm text-gray-400">
                {t('proposal:detail.likes', { count: proposal.likeCount })}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Review Section */}
      {proposal.review && (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2
            className={cn(
              'text-lg font-semibold text-gray-900 mb-4',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {t('proposal:detail.review')}
          </h2>

          <div
            className={cn(
              'flex items-center gap-2 mb-3',
              isRtl && 'flex-row-reverse'
            )}
          >
            {proposal.review.result === 'accepted' ? (
              <>
                <CheckCircle2 size={20} className="text-green-600" aria-hidden="true" />
                <Badge variant="success">
                  {t('proposal:statuses.accepted')}
                </Badge>
              </>
            ) : (
              <>
                <XCircle size={20} className="text-red-600" aria-hidden="true" />
                <Badge variant="error">
                  {t('proposal:statuses.rejected')}
                </Badge>
              </>
            )}
            <span className="text-xs text-gray-500">
              {formatDate(proposal.review.reviewedAt, lang)}
            </span>
          </div>

          {/* Review Comment */}
          <div className={cn('mt-3', isRtl ? 'text-right' : 'text-left')}>
            <p className="text-xs font-medium text-gray-500 mb-1">
              {t('proposal:detail.reviewReason')}
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {lang === 'ar'
                ? proposal.review.reviewCommentAr
                : proposal.review.reviewCommentFr}
            </p>
          </div>
        </section>
      )}

      {/* Implementation Updates */}
      {proposal.status === 'accepted' &&
        proposal.implementationUpdates &&
        proposal.implementationUpdates.length > 0 && (
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2
              className={cn(
                'text-lg font-semibold text-gray-900 mb-4',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('proposal:detail.implementation')}
            </h2>

            {/* Progress Bar */}
            <div className="mb-6">
              <div
                className={cn(
                  'flex items-center justify-between text-sm mb-1',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <span className="text-gray-600">
                  {t('proposal:detail.progress')}
                </span>
                <span className="font-semibold text-gray-900">
                  {latestProgress}%
                </span>
              </div>
              <div
                className="w-full bg-gray-200 rounded-full h-3"
                role="progressbar"
                aria-valuenow={latestProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('proposal:detail.progress')}
              >
                <div
                  className={cn(
                    'h-3 rounded-full transition-all duration-500',
                    latestProgress >= 100
                      ? 'bg-green-500'
                      : latestProgress >= 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(latestProgress, 100)}%` }}
                />
              </div>
            </div>

            {/* Update Entries */}
            <div className="space-y-3">
              {proposal.implementationUpdates.map((update) => (
                <div
                  key={update.id}
                  className={cn(
                    'border-l-2 border-primary-300 pl-4',
                    isRtl && 'border-l-0 border-r-2 pl-0 pr-4'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between text-xs text-gray-500 mb-1',
                      isRtl && 'flex-row-reverse'
                    )}
                  >
                    <span>{formatDate(update.updatedAt, lang)}</span>
                    <span className="font-medium">{update.progress}%</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {lang === 'ar' ? update.contentAr : update.contentFr}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Implementation completed indicator */}
      {proposal.status === 'implemented' && (
        <section className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
          <CheckCircle2
            size={32}
            className="text-green-600 mx-auto mb-2"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-green-800">
            {t('proposal:statuses.implemented')}
          </p>
        </section>
      )}
    </div>
  );
}
