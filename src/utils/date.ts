
import { format, formatDistanceToNow, differenceInDays, addDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: string | Date, pattern = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const f = typeof from === 'string' ? parseISO(from) : from;
  const t = typeof to === 'string' ? parseISO(to) : to;
  return differenceInDays(t, f);
}

export function daysFromNow(date: string | Date): number {
  return daysBetween(new Date(), date);
}

export function addDaysOffset(date: string | Date, days: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addDays(d, days);
}

export function getDaysInRange(days: number): Date[] {
  const result: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    result.push(addDays(today, -i));
  }
  return result;
}

export function getDateKeys(days: number): string[] {
  return getDaysInRange(days).map((d) => format(d, 'MM-dd'));
}

export function getFullDateKeys(days: number): string[] {
  return getDaysInRange(days).map((d) => format(d, 'yyyy-MM-dd'));
}
