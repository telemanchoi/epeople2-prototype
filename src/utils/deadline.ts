import { differenceInDays, parseISO } from 'date-fns';

export function getDaysRemaining(deadline: string): number {
  return differenceInDays(parseISO(deadline), new Date());
}

export function getDeadlineColor(deadline: string): string {
  const days = getDaysRemaining(deadline);
  if (days < 0)  return 'bg-red-100 text-red-800';
  if (days <= 1) return 'bg-red-100 text-red-800';
  if (days <= 3) return 'bg-orange-100 text-orange-800';
  if (days <= 7) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-600';
}

export function getDeadlineLabel(deadline: string): string {
  const days = getDaysRemaining(deadline);
  if (days < 0) return `D+${Math.abs(days)}`;
  if (days === 0) return 'D-Day';
  return `D-${days}`;
}
