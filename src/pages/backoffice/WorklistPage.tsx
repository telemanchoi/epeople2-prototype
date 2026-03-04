import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, Filter } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import type { Column, PaginationInfo } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ComplaintTypeBadge } from '@/components/common/ComplaintTypeBadge';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { Button } from '@/components/common/Button';
import { useComplaints } from '@/hooks';
import type { ComplaintFilters } from '@/hooks';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { ComplaintStatus, ComplaintType, IComplaintSummary } from '@/types';

const COMPLAINT_STATUSES: ComplaintStatus[] = [
  'received',
  'assigned',
  'processing',
  'completed',
  'closed',
];

const COMPLAINT_TYPES: ComplaintType[] = [
  'grievance',
  'proposal',
  'inquiry',
  'suggestion',
  'report',
];

const PER_PAGE = 10;

export default function WorklistPage() {
  const { t, i18n } = useTranslation(['complaint', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const navigate = useNavigate();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ComplaintType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ComplaintStatus | ''>('');

  // Build filters for the hook
  const filters: ComplaintFilters = useMemo(
    () => ({
      ...(statusFilter && { status: statusFilter }),
      ...(typeFilter && { type: typeFilter }),
      ...(searchTerm && { search: searchTerm }),
      ...(overdueOnly && { overdue: true }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      page,
      perPage: PER_PAGE,
      sortBy: 'deadline',
      sortOrder: 'asc' as const,
    }),
    [statusFilter, typeFilter, searchTerm, overdueOnly, dateFrom, dateTo, page]
  );

  const { data, isLoading } = useComplaints(filters);
  const complaints = data?.data ?? [];
  const pagination = data?.pagination;

  // Toggle checkbox for a single row
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle all on current page
  const toggleAll = useCallback(() => {
    if (selectedIds.size === complaints.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(complaints.map((c) => c.id)));
    }
  }, [complaints, selectedIds.size]);

  // Transfer warning renderer
  const renderTransferWarning = useCallback(
    (count: number) => {
      if (count >= 3) {
        return (
          <div
            className={cn(
              'flex items-center gap-1',
              isRtl && 'flex-row-reverse'
            )}
          >
            <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-bold">
              {t('complaint:backoffice.bcrcReportBadge')}
            </span>
            <span className="text-xs text-red-600 font-medium">
              {t('complaint:backoffice.bcrcReportText')}
            </span>
          </div>
        );
      }
      if (count >= 2) {
        return (
          <div
            className={cn(
              'flex items-center gap-1',
              isRtl && 'flex-row-reverse'
            )}
          >
            <AlertTriangle size={14} className="text-orange-500 shrink-0" />
            <span className="text-xs text-orange-600 font-medium">
              {t('complaint:backoffice.attentionTransfer')}
            </span>
          </div>
        );
      }
      return <span className="text-xs text-gray-500">{count}</span>;
    },
    [t, isRtl]
  );

  // Table columns
  const columns: Column<IComplaintSummary>[] = useMemo(
    () => [
      {
        key: '_select',
        header: '',
        width: '40px',
        render: (item) => (
          <input
            type="checkbox"
            checked={selectedIds.has(item.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(item.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
          />
        ),
      },
      {
        key: 'id',
        header: t('complaint:table.id'),
        sortable: true,
        width: '140px',
        render: (item) => (
          <span className="font-mono text-xs">{item.id}</span>
        ),
      },
      {
        key: 'type',
        header: t('complaint:table.type'),
        width: '130px',
        render: (item) => <ComplaintTypeBadge type={item.type} />,
      },
      {
        key: 'title',
        header: t('complaint:table.title'),
        sortable: true,
        render: (item) => (
          <span className="truncate block max-w-[200px] text-sm">
            {lang === 'ar' ? item.titleAr : item.titleFr}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('complaint:table.status'),
        width: '140px',
        render: (item) => <StatusBadge status={item.status} size="sm" />,
      },
      {
        key: 'agency',
        header: t('complaint:table.agency'),
        render: (item) => (
          <span className="text-xs text-gray-600 truncate block max-w-[160px]">
            {lang === 'ar'
              ? item.assignedAgency.nameAr
              : item.assignedAgency.nameFr}
          </span>
        ),
      },
      {
        key: 'deadline',
        header: t('complaint:table.deadline'),
        sortable: true,
        width: '100px',
        render: (item) => <DeadlineBadge deadline={item.deadline} />,
      },
      {
        key: 'transferCount',
        header: t('complaint:table.transferCount'),
        sortable: true,
        width: '150px',
        render: (item) => renderTransferWarning(item.transferCount),
      },
      {
        key: 'submittedAt',
        header: t('complaint:table.submittedAt'),
        sortable: true,
        width: '110px',
        render: (item) => (
          <span className="text-xs text-gray-500">
            {formatDate(item.submittedAt, lang)}
          </span>
        ),
      },
    ],
    [t, lang, selectedIds, toggleSelect, renderTransferWarning]
  );

  const paginationInfo: PaginationInfo | undefined = pagination
    ? {
        page: pagination.page,
        perPage: pagination.perPage,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }
    : undefined;

  const handleBulkAction = () => {
    // Simulate bulk status change (prototype only)
    if (bulkStatus && selectedIds.size > 0) {
      setSelectedIds(new Set());
      setBulkStatus('');
    }
  };

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Title */}
      <h1
        className={cn(
          'text-2xl font-bold text-gray-900',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {t('complaint:backoffice.worklistTitle')}
      </h1>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div
          className={cn(
            'flex flex-wrap gap-3 items-end',
            isRtl && 'flex-row-reverse'
          )}
        >
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label
              className="block text-xs font-medium text-gray-500 mb-1"
              htmlFor="worklist-search"
            >
              {t('common:buttons.search')}
            </label>
            <div className="relative">
              <Search
                size={16}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 text-gray-400',
                  isRtl ? 'right-3' : 'left-3'
                )}
              />
              <input
                id="worklist-search"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder={t('complaint:list.searchPlaceholder')}
                className={cn(
                  'w-full rounded-md border border-gray-300 py-2 text-sm focus:border-primary-500 focus:ring-primary-500',
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                )}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-[160px]">
            <label
              className="block text-xs font-medium text-gray-500 mb-1"
              htmlFor="worklist-status"
            >
              {t('complaint:list.filterByStatus')}
            </label>
            <select
              id="worklist-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ComplaintStatus | '');
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">{t('complaint:list.allStatuses')}</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`complaint:statuses.${s}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="min-w-[160px]">
            <label
              className="block text-xs font-medium text-gray-500 mb-1"
              htmlFor="worklist-type"
            >
              {t('complaint:list.filterByType')}
            </label>
            <select
              id="worklist-type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as ComplaintType | '');
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">{t('complaint:list.allTypes')}</option>
              {COMPLAINT_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t(`complaint:types.${ct}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="min-w-[140px]">
            <label
              className="block text-xs font-medium text-gray-500 mb-1"
              htmlFor="worklist-date-from"
            >
              {t('complaint:list.dateRange')}
            </label>
            <input
              id="worklist-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Date To */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 invisible">
              &nbsp;
            </label>
            <input
              id="worklist-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Overdue Toggle */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 invisible">
              &nbsp;
            </label>
            <button
              type="button"
              onClick={() => {
                setOverdueOnly(!overdueOnly);
                setPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                overdueOnly
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <Filter size={14} />
              {t('complaint:backoffice.overdueOnly')}
            </button>
          </div>

          {/* Reset */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 invisible">
              &nbsp;
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setSearchTerm('');
                setOverdueOnly(false);
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
            >
              {t('common:buttons.reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div
          className={cn(
            'flex items-center gap-3 bg-primary-50 rounded-lg p-3 border border-primary-200',
            isRtl && 'flex-row-reverse'
          )}
        >
          <input
            type="checkbox"
            checked={selectedIds.size === complaints.length}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-primary-800">
            {t('complaint:backoffice.selectedCount', {
              count: selectedIds.size,
            })}
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as ComplaintStatus | '')}
            className="rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">{t('complaint:backoffice.changeStatus')}</option>
            {COMPLAINT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`complaint:statuses.${s}`)}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={handleBulkAction} disabled={!bulkStatus}>
            {t('common:buttons.confirm')}
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable<IComplaintSummary>
        columns={columns}
        data={complaints}
        loading={isLoading}
        keyExtractor={(item) => item.id}
        onRowClick={(item) =>
          navigate(`/backoffice/complaints/${item.id}`)
        }
        pagination={paginationInfo}
        onPageChange={setPage}
        emptyMessage={t('complaint:list.noComplaints')}
      />
    </div>
  );
}
