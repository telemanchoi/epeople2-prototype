import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Gauge,
} from 'lucide-react';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { ComplaintTypeBadge } from '@/components/common/ComplaintTypeBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useComplaints, useStatisticsOverview } from '@/hooks';
import { getDaysRemaining } from '@/utils/deadline';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { IComplaintSummary } from '@/types';

export default function DashboardPage() {
  const { t, i18n } = useTranslation(['complaint', 'common', 'admin']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const navigate = useNavigate();

  // Fetch statistics overview
  const { data: stats, isLoading: statsLoading } = useStatisticsOverview();

  // Fetch all processing complaints
  const { data: processingData, isLoading: processingLoading } = useComplaints({
    status: 'processing',
    perPage: 100,
  });

  // Fetch completed complaints
  const { data: completedData, isLoading: completedLoading } = useComplaints({
    status: 'completed',
    perPage: 100,
  });

  // Fetch recent assigned complaints
  const { data: recentData, isLoading: recentLoading } = useComplaints({
    sortBy: 'submittedAt',
    sortOrder: 'desc',
    perPage: 5,
  });

  const processingComplaints = processingData?.data ?? [];
  const completedComplaints = completedData?.data ?? [];
  const recentComplaints = recentData?.data ?? [];

  // Compute KPI values
  const pendingCount = processingComplaints.length;

  const urgentComplaints = useMemo(
    () => processingComplaints.filter((c) => getDaysRemaining(c.deadline) <= 1),
    [processingComplaints]
  );
  const urgentCount = urgentComplaints.length;

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return completedComplaints.filter(
      (c) => c.submittedAt?.slice(0, 10) === today
    ).length;
  }, [completedComplaints]);

  const slaRate = stats?.completionRate ?? 0;

  // Deadline alert table columns
  const deadlineColumns: Column<IComplaintSummary>[] = useMemo(
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
          <span className="truncate block max-w-[200px]">
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
        key: 'deadline',
        header: t('complaint:table.deadline'),
        sortable: true,
        render: (item) => <DeadlineBadge deadline={item.deadline} />,
      },
      {
        key: 'status',
        header: t('complaint:table.status'),
        render: (item) => <StatusBadge status={item.status} size="sm" />,
      },
    ],
    [t, lang]
  );

  const isLoading = statsLoading || processingLoading || completedLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton variant="kpi" />
        <Skeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Title */}
      <h1
        className={cn(
          'text-2xl font-bold text-gray-900',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {t('complaint:backoffice.dashboardTitle')}
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t('complaint:backoffice.pendingComplaints')}
          value={pendingCount}
          icon={<ClipboardList size={24} />}
          color="blue"
        />
        <KpiCard
          title={t('complaint:backoffice.urgentComplaints')}
          value={urgentCount}
          icon={<AlertTriangle size={24} />}
          color="red"
        />
        <KpiCard
          title={t('complaint:backoffice.completedToday')}
          value={completedToday}
          icon={<CheckCircle2 size={24} />}
          color="green"
        />
        <KpiCard
          title={t('complaint:backoffice.slaComplianceRate')}
          value={`${slaRate.toFixed(1)}%`}
          icon={<Gauge size={24} />}
          color="amber"
          change={stats?.changeVsLastPeriod?.completionRate}
        />
      </div>

      {/* Deadline Alerts Section */}
      <section>
        <div
          className={cn(
            'flex items-center justify-between mb-3',
            isRtl && 'flex-row-reverse'
          )}
        >
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('complaint:backoffice.deadlineAlerts')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('complaint:backoffice.deadlineAlertsDesc')}
            </p>
          </div>
        </div>

        {urgentComplaints.length > 0 ? (
          <DataTable<IComplaintSummary>
            columns={deadlineColumns}
            data={urgentComplaints}
            keyExtractor={(item) => item.id}
            onRowClick={(item) =>
              navigate(`/backoffice/complaints/${item.id}`)
            }
          />
        ) : (
          <EmptyState
            title={t('complaint:backoffice.noDeadlineAlerts')}
            icon={<CheckCircle2 size={48} className="text-green-300" />}
          />
        )}
      </section>

      {/* Recent Assigned Complaints */}
      <section>
        <div
          className={cn(
            'flex items-center justify-between mb-3',
            isRtl && 'flex-row-reverse'
          )}
        >
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('complaint:backoffice.recentAssigned')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('complaint:backoffice.recentAssignedDesc')}
            </p>
          </div>
        </div>

        {recentLoading ? (
          <Skeleton variant="card" count={3} />
        ) : recentComplaints.length > 0 ? (
          <div className="space-y-2">
            {recentComplaints.slice(0, 5).map((complaint) => (
              <button
                key={complaint.id}
                type="button"
                onClick={() =>
                  navigate(`/backoffice/complaints/${complaint.id}`)
                }
                className={cn(
                  'w-full bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer',
                  isRtl ? 'text-right' : 'text-left'
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 flex-wrap',
                    isRtl && 'flex-row-reverse'
                  )}
                >
                  <ComplaintTypeBadge type={complaint.type} />
                  <span className="font-medium text-gray-900 text-sm truncate flex-1">
                    {lang === 'ar' ? complaint.titleAr : complaint.titleFr}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(complaint.submittedAt, lang)}
                  </span>
                </div>
                <div
                  className={cn(
                    'mt-2 flex items-center gap-2 text-xs text-gray-500',
                    isRtl && 'flex-row-reverse'
                  )}
                >
                  <span>
                    {lang === 'ar'
                      ? complaint.assignedAgency.nameAr
                      : complaint.assignedAgency.nameFr}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('complaint:backoffice.noRecentComplaints')}
          />
        )}
      </section>
    </div>
  );
}
