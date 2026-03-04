import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  keyExtractor: (item: T) => string;
  className?: string;
}

type SortDirection = 'asc' | 'desc';

interface SortState {
  key: string;
  direction: SortDirection;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  onRowClick,
  pagination,
  onPageChange,
  keyExtractor,
  className,
}: DataTableProps<T>) {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.language === 'ar';
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const sortedData = sort
    ? [...data].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sort.key];
        const bVal = (b as Record<string, unknown>)[sort.key];
        const cmp =
          typeof aVal === 'string' && typeof bVal === 'string'
            ? aVal.localeCompare(bVal)
            : typeof aVal === 'number' && typeof bVal === 'number'
              ? aVal - bVal
              : String(aVal ?? '').localeCompare(String(bVal ?? ''));
        return sort.direction === 'asc' ? cmp : -cmp;
      })
    : data;

  if (loading) {
    return <Skeleton variant="table" count={5} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage ?? t('empty.title')}
        description={t('empty.description')}
      />
    );
  }

  const from = pagination ? (pagination.page - 1) * pagination.perPage + 1 : 0;
  const to = pagination ? Math.min(pagination.page * pagination.perPage, pagination.total) : 0;

  return (
    <div className={cn('w-full', className)} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                    isRtl ? 'text-right' : 'text-left',
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700'
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sort?.key === col.key
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="inline-flex flex-col" aria-hidden="true">
                        {sort?.key === col.key ? (
                          sort.direction === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown size={14} className="text-gray-300" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-sm text-gray-800 whitespace-nowrap',
                      isRtl ? 'text-right' : 'text-left'
                    )}
                  >
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-lg',
            isRtl && 'flex-row-reverse'
          )}
        >
          <p className="text-xs text-gray-500">
            {t('pagination.showing', {
              from,
              to,
              total: pagination.total,
            })}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('buttons.previous')}
            >
              {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="text-xs text-gray-600">
              {t('pagination.page', {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>
            <button
              type="button"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('buttons.next')}
            >
              {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
