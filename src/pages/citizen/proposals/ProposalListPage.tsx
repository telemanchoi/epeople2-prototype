import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { useProposals, useToggleLike } from '@/hooks';
import { useAuthStore } from '@/stores';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import type { ProposalStatus, IProposalSummary } from '@/types';

const STATUS_BADGE_VARIANT: Record<ProposalStatus, 'info' | 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'neutral',
  under_review: 'warning',
  accepted: 'success',
  rejected: 'error',
  implemented: 'info',
};

type SortOption = 'newest' | 'mostLiked' | 'underReview';

export default function ProposalListPage() {
  const { t, i18n } = useTranslation(['proposal', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Build filters based on sort option
  const filters = useMemo(() => {
    const base: {
      sortBy?: 'createdAt' | 'likeCount' | 'status';
      sortOrder?: 'asc' | 'desc';
      status?: ProposalStatus;
      categoryL1?: string;
      page: number;
      perPage: number;
    } = {
      page,
      perPage: 10,
    };

    if (sortOption === 'newest') {
      base.sortBy = 'createdAt';
      base.sortOrder = 'desc';
    } else if (sortOption === 'mostLiked') {
      base.sortBy = 'likeCount';
      base.sortOrder = 'desc';
    } else if (sortOption === 'underReview') {
      base.status = 'under_review';
      base.sortBy = 'createdAt';
      base.sortOrder = 'desc';
    }

    if (categoryFilter) {
      base.categoryL1 = categoryFilter;
    }

    return base;
  }, [sortOption, categoryFilter, page]);

  const { data: proposalsResponse, isLoading } = useProposals(filters);
  const toggleLike = useToggleLike();

  const proposals = proposalsResponse?.data ?? [];
  const pagination = proposalsResponse?.pagination;

  const handleLike = (e: React.MouseEvent, proposalId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      // Show login required message via alert (or could use modal)
      return;
    }
    toggleLike.mutate(proposalId);
  };

  // Extract unique categories from proposals for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of proposals) {
      if (p.categoryPath?.l1) {
        set.add(
          lang === 'ar'
            ? p.categoryPath.l1.nameAr
            : p.categoryPath.l1.nameFr
        );
      }
    }
    return Array.from(set);
  }, [proposals, lang]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton variant="text" count={1} />
        <Skeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div
      className="max-w-5xl mx-auto p-6 space-y-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between flex-wrap gap-3',
          isRtl && 'flex-row-reverse'
        )}
      >
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('proposal:title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('proposal:subtitle')}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => navigate('/citizen/proposals/new')}
        >
          {t('common:buttons.newProposal')}
        </Button>
      </div>

      {/* Sort Tabs + Category Filter */}
      <div
        className={cn(
          'flex items-center justify-between flex-wrap gap-3',
          isRtl && 'flex-row-reverse'
        )}
      >
        {/* Sort Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['newest', 'mostLiked', 'underReview'] as SortOption[]).map(
            (opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setSortOption(opt);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  sortOption === opt
                    ? 'bg-white shadow-sm font-medium text-primary-700'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {opt === 'newest' && t('proposal:list.sortNewest')}
                {opt === 'mostLiked' && t('proposal:list.sortMostLiked')}
                {opt === 'underReview' && t('proposal:list.sortUnderReview')}
              </button>
            )
          )}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">{t('proposal:list.allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Proposal Cards Grid */}
      {proposals.length === 0 ? (
        <EmptyState
          title={t('proposal:list.noProposals')}
          actionLabel={t('common:buttons.newProposal')}
          onAction={() => navigate('/citizen/proposals/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              lang={lang}
              isRtl={isRtl}
              isAuthenticated={isAuthenticated}
              onLike={handleLike}
              onClick={() => navigate(`/citizen/proposals/${proposal.id}`)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 mt-6',
            isRtl && 'flex-row-reverse'
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {t('common:buttons.previous')}
          </Button>
          <span className="text-sm text-gray-600">
            {t('common:pagination.page', {
              current: page,
              total: pagination.totalPages,
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pagination.totalPages}
          >
            {t('common:buttons.next')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Proposal Card Component ────────────────────────────────

interface ProposalCardProps {
  proposal: IProposalSummary;
  lang: 'ar' | 'fr' | 'ko';
  isRtl: boolean;
  isAuthenticated: boolean;
  onLike: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function ProposalCard({
  proposal,
  lang,
  isRtl,
  isAuthenticated,
  onLike,
  onClick,
  t,
}: ProposalCardProps) {
  const title = lang === 'ar' ? proposal.titleAr : proposal.titleFr;
  const categoryName =
    lang === 'ar'
      ? proposal.categoryPath?.l1?.nameAr
      : proposal.categoryPath?.l1?.nameFr;
  const statusVariant = STATUS_BADGE_VARIANT[proposal.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer',
        isRtl ? 'text-right' : 'text-left'
      )}
    >
      {/* Header Row: title + status */}
      <div
        className={cn(
          'flex items-start justify-between gap-2 mb-3',
          isRtl && 'flex-row-reverse'
        )}
      >
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
          {title}
        </h3>
        <Badge variant={statusVariant} size="sm">
          {t(`proposal:statuses.${proposal.status}`)}
        </Badge>
      </div>

      {/* Category Badge */}
      {categoryName && (
        <span className="inline-block text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 mb-3">
          {categoryName}
        </span>
      )}

      {/* Footer: date + like */}
      <div
        className={cn(
          'flex items-center justify-between pt-3 border-t border-gray-100',
          isRtl && 'flex-row-reverse'
        )}
      >
        <span className="text-xs text-gray-500">
          {formatDate(proposal.submittedAt, lang)}
        </span>

        {/* G-05 Like Button */}
        <button
          type="button"
          onClick={(e) => onLike(e, proposal.id)}
          className={cn(
            'flex items-center gap-1 text-sm transition-colors rounded-full px-2 py-1',
            proposal.isLikedByMe
              ? 'text-red-500 hover:bg-red-50'
              : 'text-gray-400 hover:text-red-400 hover:bg-gray-50'
          )}
          title={
            !isAuthenticated
              ? t('proposal:detail.loginToLike')
              : proposal.isLikedByMe
                ? t('proposal:detail.unlike')
                : t('proposal:detail.like')
          }
        >
          <Heart
            size={16}
            fill={proposal.isLikedByMe ? 'currentColor' : 'none'}
          />
          <span className="tabular-nums text-xs font-medium">
            {proposal.likeCount}
          </span>
        </button>
      </div>
    </div>
  );
}
