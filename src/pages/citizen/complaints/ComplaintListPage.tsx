import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ComplaintTypeBadge } from '@/components/common/ComplaintTypeBadge';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { useComplaints } from '@/hooks';
import type { ComplaintFilters } from '@/hooks';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import type { IComplaintSummary, ComplaintStatus, ComplaintType } from '@/types';

const STATUSES: ComplaintStatus[] = [
  'received',
  'assigned',
  'processing',
  'completed',
  'closed',
];

const TYPES: ComplaintType[] = [
  'grievance',
  'proposal',
  'inquiry',
  'suggestion',
  'report',
];

const PER_PAGE = 10;

export default function ComplaintListPage() {
  const { t: tC } = useTranslation('complaint');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  // Filters state
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ComplaintType | ''>('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filters = useMemo<ComplaintFilters>(() => {
    const f: ComplaintFilters = {
      page,
      perPage: PER_PAGE,
    };
    if (statusFilter) f.status = statusFilter;
    if (typeFilter) f.type = typeFilter;
    if (search) f.search = search;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    return f;
  }, [statusFilter, typeFilter, search, dateFrom, dateTo, page]);

  const { data: response, isLoading } = useComplaints(filters);

  const complaints = response?.data ?? [];
  const pagination = response?.pagination;

  const handleRowClick = useCallback(
    (item: IComplaintSummary) => {
      navigate(`/citizen/complaints/${item.id}`);
    },
    [navigate]
  );

  const handleResetFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const columns: Column<IComplaintSummary>[] = useMemo(
    () => [
      {
        key: 'id',
        header: tC('table.id'),
        width: '140px',
        render: (item) => (
          <span className="font-mono text-sm text-gray-700">{item.id}</span>
        ),
      },
      {
        key: 'type',
        header: tC('table.type'),
        width: '140px',
        render: (item) => <ComplaintTypeBadge type={item.type} />,
      },
      {
        key: 'titleFr',
        header: tC('table.title'),
        render: (item) => (
          <span className="text-sm text-gray-900 truncate block max-w-[200px]">
            {lang === 'ar' ? item.titleAr : item.titleFr}
          </span>
        ),
        sortable: true,
      },
      {
        key: 'status',
        header: tC('table.status'),
        width: '150px',
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: 'assignedAgency',
        header: tC('table.agency'),
        render: (item) => (
          <span className="text-sm text-gray-600 truncate block max-w-[180px]">
            {lang === 'ar'
              ? item.assignedAgency.nameAr
              : item.assignedAgency.nameFr}
          </span>
        ),
      },
      {
        key: 'deadline',
        header: tC('table.deadline'),
        width: '100px',
        render: (item) => <DeadlineBadge deadline={item.deadline} />,
        sortable: true,
      },
      {
        key: 'submittedAt',
        header: tC('table.submittedAt'),
        width: '120px',
        render: (item) => (
          <span className="text-sm text-gray-600">
            {formatDate(item.submittedAt, lang)}
          </span>
        ),
        sortable: true,
      },
    ],
    [tC, lang]
  );

  const selectClass = cn(
    'px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white',
    isRtl ? 'text-right' : 'text-left'
  );

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div
        className={cn(
          'flex items-center justify-between flex-wrap gap-3',
          isRtl && 'flex-row-reverse'
        )}
      >
        <h1 className="text-xl font-bold text-gray-900">{tC('list.title')}</h1>
        <Button
          variant="primary"
          leftIcon={<FileText size={16} />}
          onClick={() => navigate('/citizen/complaints/new')}
        >
          {tCommon('buttons.newComplaint')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search
              size={16}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-gray-400',
                isRtl ? 'right-3' : 'left-3'
              )}
            />
            <input
              type="text"
              placeholder={tC('list.searchPlaceholder')}
              aria-label={tC('list.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(
                selectClass,
                'w-full',
                isRtl ? 'pr-9' : 'pl-9'
              )}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ComplaintStatus | '');
              setPage(1);
            }}
            aria-label={tC('list.allStatuses')}
            className={selectClass}
          >
            <option value="">{tC('list.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {tC(`statuses.${s}`)}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as ComplaintType | '');
              setPage(1);
            }}
            aria-label={tC('list.allTypes')}
            className={selectClass}
          >
            <option value="">{tC('list.allTypes')}</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {tC(`types.${t}`)}
              </option>
            ))}
          </select>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            aria-label={tC('list.dateRange') || 'Date from'}
            className={selectClass}
            placeholder={tC('list.dateRange')}
          />

          {/* Date to */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            aria-label={'Date to'}
            className={selectClass}
          />
        </div>

        {/* Reset button */}
        {(statusFilter || typeFilter || search || dateFrom || dateTo) && (
          <div className={cn('mt-3', isRtl ? 'text-right' : 'text-left')}>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              {tCommon('buttons.reset')}
            </Button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable<IComplaintSummary>
        columns={columns}
        data={complaints}
        loading={isLoading}
        emptyMessage={tC('list.noComplaints')}
        onRowClick={handleRowClick}
        keyExtractor={(item) => item.id}
        pagination={
          pagination
            ? {
                page: pagination.page,
                perPage: pagination.perPage,
                total: pagination.total,
                totalPages: pagination.totalPages,
              }
            : undefined
        }
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}
