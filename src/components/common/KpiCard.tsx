import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red';
  onClick?: () => void;
  className?: string;
}

const colorStyles: Record<NonNullable<KpiCardProps['color']>, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600' },
};

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'blue',
  onClick,
  className,
}: KpiCardProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const styles = colorStyles[color];

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'bg-white rounded-lg p-4 shadow-sm border border-gray-200',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300',
        className
      )}
    >
      <div
        className={cn(
          'flex items-start justify-between',
          isRtl && 'flex-row-reverse'
        )}
      >
        <div className={cn(isRtl ? 'text-right' : 'text-left')}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>

        <div
          className={cn(
            'p-2 rounded-lg',
            styles.bg,
            styles.icon
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      {change !== undefined && (
        <div
          className={cn(
            'mt-3 flex items-center gap-1 text-xs',
            isRtl && 'flex-row-reverse'
          )}
        >
          {isPositive && (
            <>
              <TrendingUp size={14} className="text-green-600 shrink-0" aria-hidden="true" />
              <span className="font-medium text-green-600">+{change}%</span>
            </>
          )}
          {isNegative && (
            <>
              <TrendingDown size={14} className="text-red-600 shrink-0" aria-hidden="true" />
              <span className="font-medium text-red-600">{change}%</span>
            </>
          )}
          {change === 0 && (
            <span className="font-medium text-gray-500">0%</span>
          )}
          {changeLabel && (
            <span className="text-gray-500">{changeLabel}</span>
          )}
        </div>
      )}
    </Component>
  );
}
