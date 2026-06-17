
import { useState } from 'react';
import {
  TrendingUp, Users, MessageCircle, UserMinus, Download, BarChart3, PieChart, Activity,
  UsersRound, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, LineChart, Line, PieChart as RPieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber, formatPercent } from '@/utils/format';
import { GROUP_TYPE_COLORS, CHART_COLORS } from '@/utils/constants';
import { formatDate } from '@/utils/date';

type PeriodKey = '7d' | '30d' | '90d';

export function AnalyticsOverviewPage() {
  const { groups, dailyMetrics, members, tags } = useAppStore();
  const [period, setPeriod] = useState<PeriodKey>('30d');

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const metrics = dailyMetrics.slice(-days);
  const today = metrics[metrics.length - 1];

  const churnRate = today ? today.leftMembers / today.memberCount : 0;
  const avgActiveRate = today ? today.activeMembers / today.memberCount : 0;

  const groupRankings = [...groups].sort((a, b) => b.activeMembers7d - a.activeMembers7d).slice(0, 8);
  const maxActive = groupRankings[0]?.activeMembers7d || 1;

  const topChurnGroups = [...groups]
    .map((g) => ({ ...g, churn: Math.random() * 0.08 + 0.005 }))
    .sort((a, b) => b.churn - a.churn)
    .slice(0, 5);

  const messageByHour = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    value: Math.floor(Math.exp(-Math.pow((h - 20) / 5, 2)) * 5000 + Math.random() * 800 + 200),
  }));

  const tagDistribution = tags.slice(0, 8).map((t) => ({ name: t.name, value: t.memberCount, color: t.color }));

  const healthRadar = [
    { subject: '活跃度', value: avgActiveRate * 100 + 10, fullMark: 100 },
    { subject: '留存率', value: (1 - churnRate) * 100, fullMark: 100 },
    { subject: '互动量', value: 72, fullMark: 100 },
    { subject: '转化率', value: 58, fullMark: 100 },
    { subject: '满意度', value: 85, fullMark: 100 },
    { subject: '增长力', value: 66, fullMark: 100 },
  ];

  const periods: Array<{ value: PeriodKey; label: string }> = [
    { value: '7d', label: '近7天' }, { value: '30d', label: '近30天' }, { value: '90d', label: '近90天' },
  ];

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight flex items-center gap-2">
            <BarChart3 size={22} className="text-accent-500" />数据分析
          </h1>
          <p className="text-sm text-ink-500 mt-1">全方位洞察私域运营效果，数据驱动决策</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-ink-50 rounded-lg p-0.5">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3.5 h-8 rounded-md text-xs font-medium transition-all',
                  period === p.value ? 'bg-white text-accent-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                )}
              >{p.label}</button>
            ))}
          </div>
          <button className="btn-secondary btn-sm"><Download size={14} />导出报告</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiBlock icon={Users} label="总成员数" value={formatNumber(today?.memberCount || 0)} delta="+3.2%" color="accent" positive />
        <KpiBlock icon={Activity} label="平均活跃率" value={formatPercent(avgActiveRate)} delta="+2.1%" color="brand" positive />
        <KpiBlock icon={MessageCircle} label="总消息量" value={formatNumber(metrics.reduce((s, m) => s + m.messageCount, 0))} delta="+12.8%" color="cyan" positive />
        <KpiBlock icon={UserMinus} label="流失率" value={formatPercent(churnRate)} delta="-0.4%" color="danger" positive />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="data-card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title flex items-center gap-1.5"><TrendingUp size={15} className="text-accent-500" />成员增长趋势</h3>
              <p className="section-subtitle">{periods.find((p) => p.value === period)?.label}成员总数变化</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.12)' }} />
                <Area type="monotone" dataKey="memberCount" name="总成员" stroke="#0D9488" strokeWidth={2.5} fill="url(#memberGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-1.5"><PieChart size={15} className="text-brand-500" />标签分布</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={tagDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={68} paddingAngle={1.5}>
                  {tagDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatNumber(Number(v)) + ' 人'} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {tagDistribution.slice(0, 4).map((t) => (
              <div key={t.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="text-ink-600 truncate">{t.name}</span>
                <span className="ml-auto font-display font-semibold text-ink-900">{formatNumber(t.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="data-card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title flex items-center gap-1.5"><Zap size={15} className="text-warning-500" />24小时消息活跃度</h3>
              <p className="section-subtitle">分时段群内消息分布</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.12)' }} />
                <Bar dataKey="value" name="消息量" radius={[4, 4, 0, 0]}>
                  {messageByHour.map((e, i) => {
                    const peak = e.value > 3500;
                    return <Cell key={i} fill={peak ? '#0D9488' : i % 2 ? '#2A6FF540' : '#2A6FF570'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-1.5"><UsersRound size={15} className="text-purple-500" />社群健康度</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={healthRadar}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#374151' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={30} />
                <Radar name="得分" dataKey="value" stroke="#0D9488" fill="#0D9488" fillOpacity={0.35} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">社群活跃度排行 TOP8</h3>
          </div>
          <div className="space-y-3">
            {groupRankings.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  i === 0 ? 'bg-warning-500 text-white' : i === 1 ? 'bg-ink-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-ink-100 text-ink-600'
                )}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink-800 truncate">{g.name}</span>
                    <span className="text-[11px] font-display font-semibold text-accent-600 ml-2">{g.activeMembers7d}</span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', i < 3 ? 'bg-gradient-to-r from-accent-500 to-brand-500' : 'bg-accent-400')}
                      style={{ width: `${(g.activeMembers7d / maxActive) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-1.5"><UserMinus size={15} className="text-danger-500" />高流失风险社群</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-2 py-2">社群</th>
                  <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-2 py-2">成员数</th>
                  <th className="text-right text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-2 py-2">流失率</th>
                  <th className="text-right text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-2 py-2">风险等级</th>
                </tr>
              </thead>
              <tbody>
                {topChurnGroups.map((g) => (
                  <tr key={g.id} className="border-b border-ink-50">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', GROUP_TYPE_COLORS[g.type].dot)} />
                        <span className="text-xs text-ink-800 truncate max-w-[140px]">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-xs font-display font-semibold text-ink-700">{g.memberCount}</td>
                    <td className="px-2 py-2.5 text-right text-xs font-bold text-danger-600">{formatPercent(g.churn, 2)}</td>
                    <td className="px-2 py-2.5 text-right">
                      <span className={cn(
                        'chip',
                        g.churn > 0.05 ? 'bg-danger-50 text-danger-600' : g.churn > 0.03 ? 'bg-warning-50 text-warning-700' : 'bg-accent-50 text-accent-700'
                      )}>
                        {g.churn > 0.05 ? '高风险' : g.churn > 0.03 ? '中风险' : '低风险'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiBlock({ icon: Icon, label, value, delta, color, positive }: {
  icon: any; label: string; value: string; delta: string; color: string; positive: boolean;
}) {
  const bgMap: Record<string, string> = { accent: '#EFFBF6', brand: '#F0F7FF', cyan: '#ECFEFF', danger: '#FEF2F2' };
  const fgMap: Record<string, string> = { accent: '#0D9488', brand: '#2A6FF5', cyan: '#06B6D4', danger: '#EF4444' };
  return (
    <div className="data-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bgMap[color] }}>
          <Icon size={18} style={{ color: fgMap[color] }} />
        </div>
        <span className={cn(
          'text-[11px] font-medium px-1.5 py-0.5 rounded-md',
          positive ? 'text-success-700 bg-success-50' : 'text-danger-700 bg-danger-50'
        )}>
          {delta}
        </span>
      </div>
      <div className="kpi-label mb-0.5">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
