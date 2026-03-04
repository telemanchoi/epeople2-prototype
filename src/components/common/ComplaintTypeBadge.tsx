import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Flag,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { TYPE_CONFIG } from '@/utils/complaint';
import type { ComplaintType } from '@/types/complaint';

export interface ComplaintTypeBadgeProps {
  type: ComplaintType;
  showSla?: boolean;
  className?: string;
}

const ICON_MAP: Record<ComplaintType, React.ComponentType<{ size?: number; className?: string }>> = {
  grievance: AlertCircle,
  proposal: Lightbulb,
  inquiry: HelpCircle,
  suggestion: MessageSquare,
  report: Flag,
};

export function ComplaintTypeBadge({
  type,
  showSla = false,
  className,
}: ComplaintTypeBadgeProps) {
  const { t } = useTranslation('complaint');
  const config = TYPE_CONFIG[type];
  const Icon = ICON_MAP[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        config.style,
        className
      )}
    >
      <Icon size={14} className="shrink-0" aria-hidden="true" />
      <span>{t(`types.${type}`)}</span>
      {showSla && (
        <span className="opacity-75">({t(`sla.${type}`)})</span>
      )}
    </span>
  );
}
