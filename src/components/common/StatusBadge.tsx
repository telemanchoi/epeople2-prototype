import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { STATUS_STYLES } from '@/utils/complaint';
import type { ComplaintStatus } from '@/types/complaint';

export interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeStyles: Record<NonNullable<StatusBadgeProps['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const { t } = useTranslation('complaint');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        STATUS_STYLES[status],
        sizeStyles[size],
        className
      )}
    >
      {t(`statuses.${status}`)}
    </span>
  );
}
