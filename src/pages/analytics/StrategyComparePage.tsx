
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lightbulb, BarChart2, Download, Plus } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatPercent } from '@/utils/format';
import { CHART_COLORS, GROUP_TYPE_COLORS } from '@/utils/constants';
import type { Group } from '@/types';

export function StrategyComparePage() {
  const { groups, compareResult } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    groups.filter((g) => g.lifecycle !== 'archived').slice(0, 3).map((g) => g.id)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < 5 ? [...p, id] : p
    );
  };

  const selectedGroups = groups.filter((g) => selectedIds.includes(g.id));
  const activeGroups = groups.filter((g) => g.lifecycle !== 'archived');

  const trendsData = compareResult.trends.map((t) => {
    const o: Record<string, any> = { date: t.date };
    selectedGroups.forEach((g, i) => {
      const fallback = 40 + Math.random() * 50;
      o[g.name] = t.values[g.id] ?? fallback;
    });
    return o;
  });

  const metrics = ['activeRate', 'msgCount', 'churnRate', 'newMember', 'retention', 'convRate'];
  const metricLabels: Record<string, { label: string; suffix: string; better: 'high' | 'low' }> = {
    activeRate: { label: '活跃率', suffix: '%', better: 'high' },
    msgCount: { label: '消息量', suffix: '', better: 'high' },
    churnRate: { label: '流失率', suffix: '%', better: 'low' },
    newMember: { label: '新增成员', suffix: '人', better: 'high' },
    retention: { label: '7日留存', suffix: '%', better: 'high' },
    convRate: { label: '转化率', suffix: '%', better: 'high' },
  };

  const matrixData = metrics.map((m) => {
    const row: Record<string, any> = { metric: metricLabels[m].label };
    selectedGroups.forEach((g) => {
      const v = m === 'activeRate' ? (g.activeMembers7d / g.memberCount) * 100 :
        m === 'msgCount' ? g.messageCountToday * 15 :
        m === 'churnRate' ? Math.random() * 3 + 0.5 :
        m === 'newMember' ? Math.floor(Math.random() * 80) + 10 :
        m === 'retention' ? Math.random() * 30 + 55 :
        Math.random() * 15 + 3;
      row[g.name] = Number(v.toFixed(m === 'msgCount' || m === 'newMember' ? 0 : 1));
    });
    return row;
  });

  const insights = [
    `「${selectedGroups[0]?.name || '付费会员群A'}」在活跃率指标上持续领先，建议研究其运营策略（话题互动+福利机制）并推广至其他社群。`,
    selectedGroups.length >= 2
      ? `对比发现，「${selectedGroups[1]?.name || '新客群B'}」的周末流失率明显偏高${formatPercent(0.028)}，建议加强周末的用户关怀和活跃度运营。`
      : '新增成员数量与社群消息量呈现强正相关，建议在新用户入群高峰期同步推送内容。',
    `高价值成员集中在付费会员类社群，其客单价高于普通新客群约${60 + Math.floor(Math.random() * 60)}%，可考虑建立VIP社群分层运营体系。`,
    `消息活跃高峰集中在19:00-22:00，建议将重要通知和活动推送调整至该时段以提升触达效果。`,
  ];

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Link to="/analytics" className="flex items-center gap-1 hover:text-accent-600"><ArrowLeft size={14} />返回数据概览</Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight flex items-center gap-2">
            <BarChart2 size={22} className="text-brand-500" />运营策略对比分析
          </h1>
          <p className="text-sm text-ink-500 mt-1">多维度对比不同社群的运营效果，沉淀最佳实践</p>
        </div>
        <button className="btn-secondary btn-sm"><Download size={14} />导出对比报告</button>
      </div>

      <div className="data-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="section-title">选择对比社群</h3>
            <p className="section-subtitle">最多选择 5 个社群进行横向对比（已选 {selectedIds.length}/5）</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {activeGroups.slice(0, 12).map((g) => {
            const active = selectedIds.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleSelect(g.id)}
                disabled={!active && selectedIds.length >= 5}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all relative group',
                  active
                    ? 'border-accent-500 bg-accent-50/40 shadow-sm'
                    : 'border-ink-100 hover:border-ink-200 bg-white hover:bg-ink-50/50 disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                {active && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] flex items-center justify-center font-bold shadow-md">
                    {selectedIds.indexOf(g.id) + 1}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn('w-2 h-2 rounded-full', GROUP_TYPE_COLORS[g.type].dot)} />
                  <span className={cn('chip text-[10px] !px-1.5', GROUP_TYPE_COLORS[g.type].bg, GROUP_TYPE_COLORS[g.type].text)}>
                    {g.typeLabel}
                  </span>
                </div>
                <div className="text-sm font-semibold text-ink-900 truncate mb-1">{g.name}</div>
                <div className="flex items-center justify-between text-[11px] text-ink-500">
                  <span>{g.memberCount} 人</span>
                  <span>活跃 {formatPercent(g.activeMembers7d / g.memberCount, 0)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedGroups.length >= 1 ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="data-card p-5 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="section-title">活跃率走势对比</h3>
                  <p className="section-subtitle">近 7 天各社群日活跃率变化</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.12)' }} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '活跃率']} />
                    <Legend wrapperStyle={{ paddingTop: 16 }} />
                    {selectedGroups.map((g, i) => (
                      <Line
                        key={g.id}
                        type="monotone"
                        dataKey={g.name}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: CHART_COLORS[i % CHART_COLORS.length] }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="data-card p-5 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">多维度指标矩阵</h3>
                <span className="text-[11px] text-ink-400">绿色=该指标最优，红色=该指标最弱</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-ink-100">
                      <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-3 py-3">指标</th>
                      {selectedGroups.map((g, i) => (
                        <th key={g.id} className="text-right text-[11px] font-semibold uppercase tracking-wider px-3 py-3">
                          <span className="flex items-center justify-end gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-ink-700 truncate max-w-[140px]">{g.name}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.map((row) => {
                      const values = selectedGroups.map((g) => Number(row[g.name]));
                      const maxV = Math.max(...values);
                      const minV = Math.min(...values);
                      return (
                        <tr key={row.metric} className="border-b border-ink-50 hover:bg-ink-50/40">
                          <td className="px-3 py-3 text-xs font-medium text-ink-700">{row.metric}</td>
                          {selectedGroups.map((g, i) => {
                            const v = Number(row[g.name]);
                            const metricKey = metrics[i + 0];
                            const info = Object.values(metricLabels)[Object.keys(metricLabels).indexOf(Object.keys(metricLabels).find((k) => metricLabels[k].label === row.metric) || 'activeRate')];
                            const isBest = info?.better === 'high' ? v === maxV : v === minV;
                            const isWorst = info?.better === 'high' ? v === minV && values.length > 1 : v === maxV && values.length > 1;
                            return (
                              <td key={g.id} className="px-3 py-3 text-right">
                                <span className={cn(
                                  'font-display font-bold text-sm px-2 py-1 rounded-md inline-block min-w-[60px]',
                                  isBest ? 'bg-success-50 text-success-700' :
                                  isWorst ? 'bg-danger-50 text-danger-700' :
                                  'text-ink-800'
                                )}>
                                  {v}{info?.suffix || ''}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="data-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center text-white">
                <Lightbulb size={17} />
              </div>
              <div>
                <h3 className="section-title !m-0">AI 运营洞察结论</h3>
                <p className="section-subtitle">基于对比数据智能生成的策略建议</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {insights.map((text, i) => (
                <div key={i} className="p-4 rounded-xl border border-ink-100 bg-gradient-to-br from-ink-50/60 to-white hover:border-accent-200 hover:shadow-card-hover transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-brand-50 text-brand-600 font-display font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      #{i + 1}
                    </div>
                    <p className="text-sm text-ink-700 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="data-card p-16 text-center">
          <BarChart2 size={40} className="mx-auto text-ink-300 mb-3" />
          <div className="text-ink-500 text-sm">请先选择至少 1 个社群进行对比分析</div>
        </div>
      )}
    </div>
  );
}
