import type { ComplaintStatus, ComplaintType } from '@/types/complaint';

export const STATUS_STYLES: Record<ComplaintStatus, string> = {
  received:   'bg-blue-100 text-blue-800',
  assigned:   'bg-violet-100 text-violet-800',
  processing: 'bg-amber-100 text-amber-800',
  completed:  'bg-green-100 text-green-800',
  closed:     'bg-slate-100 text-slate-600',
};

export const TYPE_CONFIG: Record<ComplaintType, { style: string; icon: string; sla: string }> = {
  grievance:  { style: 'bg-red-100 text-red-800',      icon: 'AlertCircle',   sla: '60 jours' },
  proposal:   { style: 'bg-blue-100 text-blue-800',    icon: 'Lightbulb',     sla: '30 jours' },
  inquiry:    { style: 'bg-purple-100 text-purple-800', icon: 'HelpCircle',    sla: '7 jours'  },
  suggestion: { style: 'bg-orange-100 text-orange-800', icon: 'MessageSquare', sla: '30 jours' },
  report:     { style: 'bg-pink-100 text-pink-800',     icon: 'Flag',          sla: '15 jours' },
};
