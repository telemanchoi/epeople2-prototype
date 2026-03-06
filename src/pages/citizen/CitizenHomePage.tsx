import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ListChecks,
  Flag,
  Lightbulb,
  BarChart3,
  CheckCircle2,
  Clock,
  Star,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { KpiCard } from '@/components/common/KpiCard';
import { Skeleton } from '@/components/common/Skeleton';
import { useStatisticsOverview } from '@/hooks';
import { cn } from '@/utils/cn';

export default function CitizenHomePage() {
  const { t } = useTranslation('common');
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const { data: stats, isLoading: statsLoading } = useStatisticsOverview();

  const quickMenuItems = [
    {
      labelKey: 'buttons.newComplaint',
      icon: <FileText aria-hidden="true" size={24} />,
      path: '/citizen/complaints/new',
      color: 'bg-primary-50 text-primary-700 border-primary-200',
    },
    {
      labelKey: 'nav.complaints',
      icon: <ListChecks aria-hidden="true" size={24} />,
      path: '/citizen/complaints',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      labelKey: 'nav.reports',
      icon: <Flag aria-hidden="true" size={24} />,
      path: '/citizen/reports/new',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      labelKey: 'nav.proposals',
      icon: <Lightbulb aria-hidden="true" size={24} />,
      path: '/citizen/proposals',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const notices = [
    {
      titleKey: 'home.notice1Title',
      contentKey: 'home.notice1Content',
      date: '2024-03-01',
    },
    {
      titleKey: 'home.notice2Title',
      contentKey: 'home.notice2Content',
      date: '2024-02-15',
    },
    {
      titleKey: 'home.notice3Title',
      contentKey: 'home.notice3Content',
      date: '2024-02-10',
    },
  ];

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-epeople-700 p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {t('home.heroTitle')}
          </h1>
          <p className="text-white/90 text-sm md:text-base mb-6 leading-relaxed">
            {t('home.heroSubtitle')}
          </p>
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<FileText size={18} />}
            onClick={() => navigate('/citizen/complaints/new')}
            className="bg-white text-primary-800 hover:bg-gray-100"
          >
            {t('buttons.newComplaint')}
          </Button>
        </div>
        {/* Decorative circles */}
        <div aria-hidden="true" className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div aria-hidden="true" className="absolute bottom-0 right-24 w-40 h-40 bg-white/5 rounded-full translate-y-1/3" />
      </section>

      {/* Quick Menu */}
      <section>
        <h2 className={cn('text-lg font-semibold text-gray-900 mb-4', 'text-left rtl:text-right')}>
          {t('home.quickMenu')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickMenuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
                item.color
              )}
            >
              {item.icon}
              <span className="text-sm font-medium text-center">
                {t(item.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* KPI Summary */}
      <section>
        <h2 className={cn('text-lg font-semibold text-gray-900 mb-4', 'text-left rtl:text-right')}>
          {t('home.kpi')}
        </h2>
        {statsLoading ? (
          <Skeleton variant="kpi" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title={t('home.totalReceived')}
              value={stats?.totalReceived.toLocaleString() ?? '0'}
              change={stats?.changeVsLastPeriod.received}
              changeLabel={t('home.vsLastPeriod')}
              icon={<BarChart3 size={22} />}
              color="blue"
            />
            <KpiCard
              title={t('home.completionRate')}
              value={`${stats?.completionRate ?? 0}%`}
              change={stats?.changeVsLastPeriod.completionRate}
              changeLabel={t('home.vsLastPeriod')}
              icon={<CheckCircle2 size={22} />}
              color="green"
            />
            <KpiCard
              title={t('home.avgDays')}
              value={stats?.avgProcessingDays?.toFixed(1) ?? '0'}
              icon={<Clock size={22} />}
              color="amber"
            />
            <KpiCard
              title={t('home.satisfaction')}
              value={`${stats?.avgSatisfactionScore?.toFixed(1) ?? '0'} / 5`}
              icon={<Star size={22} />}
              color="blue"
            />
          </div>
        )}
      </section>

      {/* Recent Notices */}
      <section>
        <h2 className={cn('text-lg font-semibold text-gray-900 mb-4', 'text-left rtl:text-right')}>
          {t('home.notices')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notices.map((notice, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={cn(
                  'flex items-center gap-2 mb-3',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <Megaphone size={16} className="text-primary-600 shrink-0" />
                <span className="text-xs text-gray-600">{notice.date}</span>
              </div>
              <h3 className={cn('text-sm font-semibold text-gray-900 mb-2', 'text-left rtl:text-right')}>
                {t(notice.titleKey)}
              </h3>
              <p className={cn('text-sm text-gray-600 leading-relaxed', 'text-left rtl:text-right')}>
                {t(notice.contentKey)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
