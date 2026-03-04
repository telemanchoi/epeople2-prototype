import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

export type TimelineVariant = 'default' | 'transfer' | 'warning' | 'completed';

export interface TimelineItem {
  action: string;
  agencyName?: string;
  note?: string;
  timestamp: string;
  variant?: TimelineVariant;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const dotStyles: Record<TimelineVariant, string> = {
  default: 'bg-gray-400',
  transfer: 'bg-blue-500',
  warning: 'bg-amber-500',
  completed: 'bg-green-500',
};

const lineStyles: Record<TimelineVariant, string> = {
  default: 'border-gray-200',
  transfer: 'border-blue-200',
  warning: 'border-amber-200',
  completed: 'border-green-200',
};

export function Timeline({ items, className }: TimelineProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  if (items.length === 0) return null;

  return (
    <div
      className={cn('relative', className)}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <ol className="relative">
        {items.map((item, index) => {
          const variant = item.variant ?? 'default';
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className={cn(
                'relative',
                isRtl ? 'pr-8' : 'pl-8',
                !isLast && 'pb-6'
              )}
            >
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute top-3 w-0 border-l-2',
                    isRtl ? 'right-[11px]' : 'left-[11px]',
                    'h-full',
                    lineStyles[variant]
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Dot */}
              <div
                className={cn(
                  'absolute top-1.5 w-3 h-3 rounded-full ring-4 ring-white',
                  isRtl ? 'right-[5px]' : 'left-[5px]',
                  dotStyles[variant]
                )}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="min-w-0">
                <div
                  className={cn(
                    'flex items-center justify-between gap-4 flex-wrap',
                    isRtl && 'flex-row-reverse'
                  )}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {item.action}
                  </p>
                  <time className="text-xs text-gray-500 whitespace-nowrap">
                    {item.timestamp}
                  </time>
                </div>
                {item.agencyName && (
                  <p className="mt-0.5 text-xs text-gray-600">
                    {item.agencyName}
                  </p>
                )}
                {item.note && (
                  <p className="mt-1 text-xs text-gray-500 italic">
                    {item.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
