
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/format';
import { formatDelta } from '@/utils/format';

interface Props {
  label: string;
  value: string | number;
  delta?: number;
  deltaSuffix?: string;
  accentColor?: 'accent' | 'brand' | 'warning' | 'danger' | 'purple' | 'cyan';
  icon?: React.ReactNode;
  formatValue?: (v: any) => string;
}

const TOPBAR_COLORS: Record<NonNullable<Props['accentColor']>, string> = {
  accent: 'bg-accent-500',
  brand: 'bg-brand-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
};

export function KpiCard({ label, value, delta, deltaSuffix = '%', accentColor = 'accent', icon }: Props) {
  const deltaResult = delta !== undefined ? formatDelta(delta, deltaSuffix) : null;
  const deltaPositive = deltaResult?.positive;

  return (
    <div className="data-card relative p-5 group">
      <div
        className={cn('absolute top-0 left-0 right-0 h-[2px] rounded-t-xl', TOPBAR_COLORS[accentColor])}
      />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
          {deltaResult && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2 text-xs font-medium px-1.5 py-0.5 rounded-md',
              deltaPositive ? 'text-success-700 bg-success-50' : 'text-danger-700 bg-danger-50'
            )}>
              {deltaPositive ? <TrendingUp size={12} /> : delta === 0 ? null : <TrendingDown size={12} />}
              {deltaResult.label}
              <span className="text-ink-400 font-normal">较前日</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
            `bg-${accentColor}-50 text-${accentColor}-600`
          )} style={{
            backgroundColor: accentColor === 'accent' ? '#EFFBF6' : accentColor === 'brand' ? '#F0F7FF' : accentColor === 'warning' ? '#FFF7EC' : accentColor === 'danger' ? '#FEF2F2' : accentColor === 'purple' ? '#FAF5FF' : '#ECFEFF',
            color: accentColor === 'accent' ? '#0D9488' : accentColor === 'brand' ? '#2A6FF5' : accentColor === 'warning' ? '#F59E0B' : accentColor === 'danger' ? '#EF4444' : accentColor === 'purple' ? '#8B5CF6' : '#06B6D4',
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
