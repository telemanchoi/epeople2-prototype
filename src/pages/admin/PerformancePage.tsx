import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { useByAgency } from '@/hooks';
import { cn } from '@/utils/cn';
import type { IAgencyPerformance } from '@/types';

export default function PerformancePage() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const [searchTerm, setSearchTerm] = useState('');
  const { data: agencyData, isLoading } = useByAgency();

  // Filter by agency name search
  const filteredData = useMemo(() => {
    if (!agencyData) return [];
    if (!searchTerm.trim()) return agencyData;
    const lower = searchTerm.toLowerCase();
    return agencyData.filter(
      (a) =>
        a.agency.nameFr.toLowerCase().includes(lower) ||
        a.agency.nameAr.includes(searchTerm)
    );
  }, [agencyData, searchTerm]);

  // Table columns
  const columns: Column<IAgencyPerformance>[] = useMemo(
    () => [
      {
        key: 'agency',
        header: t('admin:performance.agency'),
        render: (item) => (
          <span className="text-sm font-medium truncate block max-w-[200px]">
            {lang === 'ar' ? item.agency.nameAr : item.agency.nameFr}
          </span>
        ),
      },
      {
        key: 'received',
        header: t('admin:performance.received'),
        sortable: true,
        render: (item) => (
          <span className="text-sm tabular-nums">{item.received}</span>
        ),
      },
      {
        key: 'completed',
        header: t('admin:performance.completed'),
        sortable: true,
        render: (item) => (
          <span className="text-sm tabular-nums">{item.completed}</span>
        ),
      },
      {
        key: 'completionRate',
        header: t('admin:performance.completionRate'),
        sortable: true,
        render: (item) => (
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              item.completionRate < 80 ? 'text-red-700' : 'text-green-700'
            )}
          >
            {item.completionRate.toFixed(1)}%
          </span>
        ),
      },
      {
        key: 'avgProcessingDays',
        header: t('admin:performance.avgDays'),
        sortable: true,
        render: (item) => (
          <span className="text-sm tabular-nums">
            {item.avgProcessingDays.toFixed(1)}
          </span>
        ),
      },
      {
        key: 'slaComplianceRate',
        header: t('admin:performance.slaCompliance'),
        sortable: true,
        render: (item) => (
          <span className="text-sm tabular-nums">
            {item.slaComplianceRate.toFixed(1)}%
          </span>
        ),
      },
      {
        key: 'satisfactionScore',
        header: t('admin:performance.satisfaction'),
        sortable: true,
        render: (item) => (
          <span className="text-sm tabular-nums">
            {item.satisfactionScore.toFixed(1)}
          </span>
        ),
      },
      {
        key: 'transferCount',
        header: t('admin:performance.transfers'),
        sortable: true,
        render: (item) => (
          <span className="text-sm tabular-nums">{item.transferCount}</span>
        ),
      },
      {
        key: 'overdueCount',
        header: t('admin:performance.overdue'),
        sortable: true,
        render: (item) => (
          <span
            className={cn(
              'text-sm tabular-nums',
              item.overdueCount > 0 ? 'text-red-600 font-semibold' : ''
            )}
          >
            {item.overdueCount}
          </span>
        ),
      },
    ],
    [t, lang]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton variant="text" count={1} />
        <Skeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Title */}
      <div
        className={cn(
          'flex items-center justify-between flex-wrap gap-3',
          isRtl && 'flex-row-reverse'
        )}
      >
        <h1
          className={cn(
            'text-2xl font-bold text-gray-900',
            isRtl ? 'text-right' : 'text-left'
          )}
        >
          {t('admin:performance.title')}
        </h1>

        {/* Export button (placeholder) */}
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download size={16} />}
          onClick={() => {
            // Export placeholder
          }}
        >
          {t('admin:performance.export')}
        </Button>
      </div>

      {/* G-11 Warning */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700',
          isRtl && 'flex-row-reverse'
        )}
      >
        <Badge variant="error" size="sm">G-11</Badge>
        <span>{t('admin:performance.lowPerformanceWarning')}</span>
      </div>

      {/* Search */}
      <div
        className={cn(
          'flex items-center gap-2',
          isRtl && 'flex-row-reverse'
        )}
      >
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-gray-400',
              isRtl ? 'right-3' : 'left-3'
            )}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin:performance.searchAgency')}
            className={cn(
              'w-full border border-gray-300 rounded-md py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
              isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
            )}
          />
        </div>
      </div>

      {/* Performance Table with G-11 red highlighting */}
      <div className="[&_tr]:transition-colors">
        <DataTable<IAgencyPerformance>
          columns={columns}
          data={filteredData}
          keyExtractor={(item) => item.agency.id}
        />
      </div>

      {/* Custom CSS for G-11: highlight rows with completionRate < 80% */}
      {/* Since DataTable doesn't support row classNames directly,
          we use the render functions above to show red text for low rates.
          The row-level highlighting is achieved through the sortable column's
          visual cues (red font for completionRate < 80%). */}
    </div>
  );
}
