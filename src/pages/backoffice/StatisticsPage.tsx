import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { ComplaintTypeBadge } from '@/components/common/ComplaintTypeBadge';
import { Skeleton } from '@/components/common/Skeleton';
import {
  useTrend,
  useByType,
  useByAgency,
  useRepeatedComplaints,
  useLongOverdue,
} from '@/hooks';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import type {
  IRepeatedComplaintRecord,
  ILongOverdueComplaint,
} from '@/types';

const TYPE_COLORS: Record<string, string> = {
  grievance: '#ef4444',
  proposal: '#3b82f6',
  inquiry: '#a855f7',
  suggestion: '#f97316',
  report: '#ec4899',
};

export default function StatisticsPage() {
  const { t, i18n } = useTranslation(['admin', 'complaint', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters = useMemo(() => {
    const f: { dateFrom?: string; dateTo?: string } = {};
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    return f;
  }, [dateFrom, dateTo]);

  const { data: trendData, isLoading: trendLoading } = useTrend({
    ...filters,
    period: 'monthly',
  });
  const { data: typeData, isLoading: typeLoading } = useByType(filters);
  const { data: agencyData, isLoading: agencyLoading } = useByAgency(filters);
  const { data: repeatedData, isLoading: repeatedLoading } =
    useRepeatedComplaints(filters);
  const { data: overdueData, isLoading: overdueLoading } =
    useLongOverdue(filters);

  // Repeated complaints table columns
  const repeatedColumns: Column<IRepeatedComplaintRecord>[] = useMemo(
    () => [
      {
        key: 'citizenId',
        header: t('admin:statistics.citizenId'),
        render: (item) => (
          <span className="font-mono text-xs">{item.citizenId}</span>
        ),
      },
      {
        key: 'repeatCount',
        header: t('admin:statistics.repeatCount'),
        sortable: true,
        render: (item) => (
          <span className="font-semibold text-red-600">
            {item.repeatCount}
          </span>
        ),
      },
      {
        key: 'categories',
        header: t('admin:statistics.categories'),
        render: (item) => (
          <span className="text-xs text-gray-600">
            {item.categories.join(', ')}
          </span>
        ),
      },
      {
        key: 'lastComplaintAt',
        header: t('admin:statistics.lastComplaintAt'),
        sortable: true,
        render: (item) => (
          <span className="text-xs">{formatDate(item.lastComplaintAt, lang)}</span>
        ),
      },
      {
        key: 'totalUnresolved',
        header: t('admin:statistics.totalUnresolved'),
        sortable: true,
        render: (item) => (
          <span
            className={cn(
              'font-medium',
              item.totalUnresolved > 0 ? 'text-red-600' : 'text-green-600'
            )}
          >
            {item.totalUnresolved}
          </span>
        ),
      },
    ],
    [t, lang]
  );

  // Long overdue table columns
  const overdueColumns: Column<ILongOverdueComplaint>[] = useMemo(
    () => [
      {
        key: 'complaintId',
        header: t('admin:statistics.complaintId'),
        sortable: true,
        render: (item) => (
          <span className="font-mono text-xs">{item.complaintId}</span>
        ),
      },
      {
        key: 'type',
        header: t('admin:statistics.type'),
        render: (item) => <ComplaintTypeBadge type={item.type} />,
      },
      {
        key: 'titleFr',
        header: t('complaint:table.title'),
        render: (item) => (
          <span className="text-sm truncate block max-w-[200px]">
            {item.titleFr}
          </span>
        ),
      },
      {
        key: 'daysOverdue',
        header: t('admin:statistics.daysOverdue'),
        sortable: true,
        render: (item) => (
          <span
            className={cn(
              'font-semibold',
              item.daysOverdue >= 60 ? 'text-red-700' : 'text-orange-600'
            )}
          >
            +{item.daysOverdue}
          </span>
        ),
      },
      {
        key: 'assignedAgency',
        header: t('admin:statistics.assignedAgency'),
        render: (item) => (
          <span className="text-xs text-gray-600 truncate block max-w-[180px]">
            {lang === 'ar'
              ? item.assignedAgency.nameAr
              : item.assignedAgency.nameFr}
          </span>
        ),
      },
      {
        key: 'assignedOfficer',
        header: t('admin:statistics.assignedOfficer'),
        render: (item) => (
          <span className="text-xs text-gray-500">
            {item.assignedOfficer?.name ?? '-'}
          </span>
        ),
      },
    ],
    [t, lang]
  );

  // Prepare agency bar chart data (top 10 by received)
  const agencyChartData = useMemo(() => {
    if (!agencyData) return [];
    return [...agencyData]
      .sort((a, b) => b.received - a.received)
      .slice(0, 10)
      .map((a) => ({
        name:
          lang === 'ar'
            ? a.agency.nameAr
            : a.agency.nameFr.length > 25
              ? a.agency.nameFr.slice(0, 25) + '...'
              : a.agency.nameFr,
        received: a.received,
        completed: a.completed,
        overdue: a.overdueCount,
      }));
  }, [agencyData, lang]);

  const isLoading =
    trendLoading || typeLoading || agencyLoading || repeatedLoading || overdueLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton variant="kpi" />
        <Skeleton variant="table" />
        <Skeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Title */}
      <h1
        className={cn(
          'text-2xl font-bold text-gray-900',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {t('admin:statistics.title')}
      </h1>

      {/* Period Selector */}
      <div
        className={cn(
          'flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4',
          isRtl && 'flex-row-reverse'
        )}
      >
        <span className="text-sm font-medium text-gray-700">
          {t('admin:statistics.periodSelector')}
        </span>
        <div className={cn('flex items-center gap-2', isRtl && 'flex-row-reverse')}>
          <label className="text-xs text-gray-500" htmlFor="dateFrom">
            {t('admin:statistics.dateFrom')}
          </label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className={cn('flex items-center gap-2', isRtl && 'flex-row-reverse')}>
          <label className="text-xs text-gray-500" htmlFor="dateTo">
            {t('admin:statistics.dateTo')}
          </label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2
          className={cn(
            'text-lg font-semibold text-gray-900 mb-4',
            isRtl ? 'text-right' : 'text-left'
          )}
        >
          {t('admin:statistics.monthlyTrend')}
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
              reversed={isRtl}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="received"
              name={t('admin:statistics.received')}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name={t('admin:statistics.completed')}
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="overdue"
              name={t('admin:statistics.overdue')}
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Type Distribution + Agency Chart in 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart by Type */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2
            className={cn(
              'text-lg font-semibold text-gray-900 mb-4',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {t('admin:statistics.byType')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData ?? []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="count"
                nameKey="type"
                label={(props: PieLabelRenderProps) => {
                  const type = String((props as PieLabelRenderProps & { type?: string }).type ?? '');
                  const pct = Number((props as PieLabelRenderProps & { percentage?: number }).percentage ?? 0);
                  return `${t(`complaint:types.${type}`)} (${pct.toFixed(1)}%)`;
                }}
                labelLine
              >
                {(typeData ?? []).map((entry) => (
                  <Cell
                    key={entry.type}
                    fill={TYPE_COLORS[entry.type] ?? '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  String(value ?? ''),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Horizontal Bar Chart by Agency */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2
            className={cn(
              'text-lg font-semibold text-gray-900 mb-4',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {t('admin:statistics.topAgencies')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={agencyChartData}
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10 }}
                width={140}
              />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend />
              <Bar
                dataKey="received"
                name={t('admin:statistics.received')}
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="completed"
                name={t('admin:statistics.completed')}
                fill="#22c55e"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* G-06: Repeated Complaints TOP 10 */}
      <section>
        <div className={cn('mb-3', isRtl ? 'text-right' : 'text-left')}>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('admin:statistics.repeatedComplaints')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('admin:statistics.repeatedDesc')}
          </p>
        </div>
        <DataTable<IRepeatedComplaintRecord>
          columns={repeatedColumns}
          data={repeatedData ?? []}
          keyExtractor={(item) => item.citizenId}
        />
      </section>

      {/* G-06: Long Overdue List */}
      <section>
        <div className={cn('mb-3', isRtl ? 'text-right' : 'text-left')}>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('admin:statistics.longOverdue')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('admin:statistics.longOverdueDesc')}
          </p>
        </div>
        <DataTable<ILongOverdueComplaint>
          columns={overdueColumns}
          data={overdueData ?? []}
          keyExtractor={(item) => item.complaintId}
        />
      </section>
    </div>
  );
}
