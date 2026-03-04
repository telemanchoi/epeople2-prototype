import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, CheckCircle2, FileSearch } from 'lucide-react';
import { SidePanelDrawer } from '@/components/common/SidePanelDrawer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { useDuplicateCheck } from '@/hooks';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { ComplaintStatus } from '@/types';

export interface SimilarCasesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  categoryL2Code: string;
  regionCode: string;
}

interface SimilarComplaint {
  id: string;
  titleFr: string;
  status: ComplaintStatus;
  submittedAt: string;
}

interface DuplicateCheckResponse {
  data: {
    hasSimilar: boolean;
    similarComplaints: SimilarComplaint[];
    message: { fr: string; ar: string };
  };
}

export function SimilarCasesPanel({
  isOpen,
  onClose,
  complaintId: _complaintId,
  categoryL2Code,
  regionCode,
}: SimilarCasesPanelProps) {
  const { t, i18n } = useTranslation(['complaint', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useDuplicateCheck(
    isOpen && categoryL2Code && regionCode
      ? { categoryL2: categoryL2Code, regionCode }
      : undefined
  );

  const response = data as DuplicateCheckResponse | undefined;
  const similarCases = response?.data?.similarComplaints ?? [];

  const handleCopyToAnswer = useCallback(
    (item: SimilarComplaint) => {
      const text = item.titleFr;
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    },
    []
  );

  return (
    <SidePanelDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('complaint:process.similarCasesTitle')}
      width="lg"
    >
      <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {t('complaint:process.similarCasesLoading')}
            </p>
            <Skeleton variant="card" count={3} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && similarCases.length === 0 && (
          <EmptyState
            icon={<FileSearch size={48} />}
            title={t('complaint:process.similarCasesEmpty')}
          />
        )}

        {/* Results */}
        {!isLoading && similarCases.length > 0 && (
          <ul className="space-y-3">
            {similarCases.map((item) => (
              <li
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                {/* Title + status */}
                <div
                  className={cn(
                    'flex items-start justify-between gap-2 mb-2',
                    isRtl && 'flex-row-reverse'
                  )}
                >
                  <div className={cn('flex-1 min-w-0', isRtl ? 'text-right' : 'text-left')}>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.titleFr}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">
                      {item.id}
                    </p>
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                {/* Submitted date */}
                <p className="text-xs text-gray-500 mb-3">
                  {formatDate(item.submittedAt, lang)}
                </p>

                {/* Copy button */}
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    copiedId === item.id ? (
                      <CheckCircle2 size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )
                  }
                  onClick={() => handleCopyToAnswer(item)}
                  className={cn(
                    copiedId === item.id && 'text-green-600'
                  )}
                >
                  {copiedId === item.id
                    ? t('complaint:process.copiedToClipboard')
                    : t('complaint:process.copyToAnswer')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidePanelDrawer>
  );
}
