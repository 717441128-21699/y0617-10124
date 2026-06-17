
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, digits = 0): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toFixed(digits);
}

export function formatPercent(value: number, digits = 1): string {
  return (value * 100).toFixed(digits) + '%';
}

export function formatCurrency(value: number): string {
  return '¥' + value.toLocaleString('zh-CN');
}

export function formatDelta(value: number, suffix = '%'): { label: string; positive: boolean } {
  if (value === 0) return { label: '0' + suffix, positive: false };
  const positive = value > 0;
  return {
    label: `${positive ? '+' : ''}${value.toFixed(1)}${suffix}`,
    positive,
  };
}

export function truncateText(text: string, maxLen = 50): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-brand-100 text-brand-700',
    'bg-accent-100 text-accent-700',
    'bg-warning-100 text-warning-700',
    'bg-danger-100 text-danger-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-cyan-100 text-cyan-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}
