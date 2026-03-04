import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr, arSA, ko } from 'date-fns/locale';

const locales = { fr, ar: arSA, ko };

export function formatDate(dateStr: string, lang: 'ar' | 'fr' | 'ko' = 'fr'): string {
  return format(parseISO(dateStr), 'dd MMM yyyy', { locale: locales[lang] });
}

export function formatDateTime(dateStr: string, lang: 'ar' | 'fr' | 'ko' = 'fr'): string {
  return format(parseISO(dateStr), 'dd MMM yyyy HH:mm', { locale: locales[lang] });
}

export function formatRelative(dateStr: string, lang: 'ar' | 'fr' | 'ko' = 'fr'): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: locales[lang] });
}
