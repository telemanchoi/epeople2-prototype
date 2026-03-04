import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getDeadlineColor, getDeadlineLabel, getDaysRemaining } from '@/utils/deadline';

export interface DeadlineBadgeProps {
  deadline: string;
  className?: string;
}

export function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
  const { t } = useTranslation('complaint');
  const colorClass = getDeadlineColor(deadline);
  const label = getDeadlineLabel(deadline);
  const days = getDaysRemaining(deadline);

  const ariaLabel =
    days < 0
      ? t('detail.daysOverdue', { days: Math.abs(days) })
      : t('detail.daysRemaining', { days });

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        colorClass,
        className
      )}
      title={ariaLabel}
    >
      <Clock size={12} className="shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
