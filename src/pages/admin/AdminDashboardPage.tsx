import { useMemo } from 'react';
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
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import {
  useStatisticsOverview,
  useTrend,
  useByType,
  useByAgency,
  useComplaints,
} from '@/hooks';
import { cn } from '@/utils/cn';
import type { IComplaintSummary } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  grievance: '#ef4444',
  proposal: '#3b82f6',
  inquiry: '#a855f7',
  suggestion: '#f97316',
  report: '#ec4899',
};

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation(['admin', 'complaint', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  // Data fetching
  const { data: stats, isLoading: statsLoading } = useStatisticsOverview();
  const { data: trendData, isLoading: trendLoading } = useTrend({
    period: 'daily',
  });
  const { data: typeData, isLoading: typeLoading } = useByType();
  const { data: agencyData, isLoading: agencyLoading } = useByAgency();
  const { data: complaintsData, isLoading: complaintsLoading } = useComplaints({
    perPage: 100,
  });

  // Transfer warning: filter complaints with transferCount >= 2
  const transferWarnings = useMemo(() => {
    const data = complaintsData?.data ?? [];
    return data.filter((c) => c.transferCount >= 2);
  }, [complaintsData]);

  // Top 10 agencies by completion rate for bar chart
  const agencyChartData = useMemo(() => {
    if (!agencyData) return [];
    return [...agencyData]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10)
      .map((a) => ({
        name:
          lang === 'ar'
            ? a.agency.nameAr
            : a.agency.nameFr.length > 20
              ? a.agency.nameFr.slice(0, 20) + '...'
              : a.agency.nameFr,
        completionRate: a.completionRate,
      }));
  }, [agencyData, lang]);

  // Recent 30 days trend
  const recentTrend = useMemo(() => {
    if (!trendData) return [];
    return trendData.slice(-30);
  }, [trendData]);

  // Transfer warning table columns
  const transferColumns: Column<IComplaintSummary>[] = useMemo(
    () => [
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
        key: 'title',
        header: t('complaint:table.title'),
        render: (item) => (
          <span className="text-sm truncate block max-w-[200px]">
            {lang === 'ar' ? item.titleAr : item.titleFr}
          </span>
        ),
      },
      {
        key: 'agency',
        header: t('complaint:table.agency'),
        render: (item) => (
          <span className="text-xs text-gray-600 truncate block max-w-[180px]">
            {lang === 'ar'
              ? item.assignedAgency.nameAr
              : item.assignedAgency.nameFr}
          </span>
        ),
      },
      {
        key: 'transferCount',
        header: t('admin:dashboard.transferCount'),
        sortable: true,
        render: (item) => (
          <div className={cn('flex items-center gap-1', isRtl && 'flex-row-reverse')}>
            <span
              className={cn(
                'font-semibold',
                item.transferCount >= 3 ? 'text-red-700' : 'text-orange-600'
              )}
            >
              {item.transferCount}
            </span>
            {item.transferCount >= 3 && (
              <Badge variant="error" size="sm">
                {t('admin:dashboard.transferCountWarning')}
              </Badge>
            )}
            {item.transferCount === 2 && (
              <AlertTriangle size={14} className="text-orange-500" />
            )}
          </div>
        ),
      },
    ],
    [t, lang, isRtl]
  );

  const isLoading =
    statsLoading || trendLoading || typeLoading || agencyLoading || complaintsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton variant="kpi" />
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
        {t('admin:dashboard.title')}
      </h1>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t('admin:dashboard.totalComplaints')}
          value={stats?.totalReceived ?? 0}
          icon={<ClipboardList size={24} />}
          color="blue"
          change={stats?.changeVsLastPeriod?.received}
        />
        <KpiCard
          title={t('admin:dashboard.completionRate')}
          value={`${(stats?.completionRate ?? 0).toFixed(1)}%`}
          icon={<CheckCircle2 size={24} />}
          color="green"
          change={stats?.changeVsLastPeriod?.completionRate}
        />
        <KpiCard
          title={t('admin:dashboard.avgProcessingDays')}
          value={(stats?.avgProcessingDays ?? 0).toFixed(1)}
          icon={<Clock size={24} />}
          color="amber"
        />
        <KpiCard
          title={t('admin:dashboard.satisfactionScore')}
          value={`${(stats?.avgSatisfactionScore ?? 0).toFixed(1)} / 5`}
          icon={<Star size={24} />}
          color="blue"
        />
      </div>

      {/* Charts Row: Agency performance bar + Daily trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agency Performance Bar Chart */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2
            className={cn(
              'text-lg font-semibold text-gray-900 mb-4',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {t('admin:dashboard.top10Agencies')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={agencyChartData}
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10 }}
                width={120}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`]}
              />
              <Bar
                dataKey="completionRate"
                name={t('admin:dashboard.completionRate')}
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Daily Trend Line Chart */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2
            className={cn(
              'text-lg font-semibold text-gray-900 mb-4',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {t('admin:dashboard.recentTrend')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10 }}
                reversed={isRtl}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="received"
                name={t('admin:statistics.received')}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name={t('admin:statistics.completed')}
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Type Distribution Pie Chart */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2
          className={cn(
            'text-lg font-semibold text-gray-900 mb-4',
            isRtl ? 'text-right' : 'text-left'
          )}
        >
          {t('admin:dashboard.typeDistribution')}
        </h2>
        <div className="flex justify-center">
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
                formatter={(value) => [String(value ?? '')]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Transfer Warning List */}
      <section>
        <div className={cn('mb-3', isRtl ? 'text-right' : 'text-left')}>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('admin:dashboard.transferWarnings')}
          </h2>
        </div>
        <DataTable<IComplaintSummary>
          columns={transferColumns}
          data={transferWarnings}
          keyExtractor={(item) => item.id}
        />
      </section>
    </div>
  );
}
