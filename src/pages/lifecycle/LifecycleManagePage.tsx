
import { useState } from 'react';
import {
  Clock, Archive, RefreshCcw, ArrowRight, Users, Trophy, AlertTriangle, CheckCircle,
  ChevronRight, Send, Calendar, Shield, TrendingDown,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatNumber, formatCurrency, formatPercent } from '@/utils/format';
import { GROUP_TYPE_COLORS, LIFECYCLE_COLORS, LIFECYCLE_LABELS } from '@/utils/constants';
import { formatDate, daysFromNow } from '@/utils/date';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { ExpiringGroup, HighValueMember } from '@/types';

export function LifecycleManagePage() {
  const { expiringGroups, highValueMembers, groups, archiveGroup } = useAppStore();
  const [activeTab, setActiveTab] = useState<'expiring' | 'archived' | 'migrate'>('expiring');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    expiringGroups.find((g) => g.suggestedAction === 'migrate')?.id || expiringGroups[0]?.id || null
  );

  const current = expiringGroups.find((g) => g.id === selectedGroup);
  const archivedGroups = groups.filter((g) => g.lifecycle === 'archived');
  const membersOfSelected = highValueMembers.slice(0, 12);

  const lifecycleData = (['preparation', 'active', 'declining', 'archived'] as const).map((l) => ({
    name: LIFECYCLE_LABELS[l],
    count: groups.filter((g) => g.lifecycle === l).length,
    fill: LIFECYCLE_COLORS[l].includes('success') ? '#10B981' : LIFECYCLE_COLORS[l].includes('warning') ? '#F59E0B' : LIFECYCLE_COLORS[l].includes('ink') ? '#9CA3AF' : '#2A6FF5',
  }));

  const migrateTargets = groups.filter((g) => g.lifecycle === 'active' && g.id !== selectedGroup);

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight flex items-center gap-2">
            <RefreshCcw size={22} className="text-accent-500" />群生命周期管理
          </h1>
          <p className="text-sm text-ink-500 mt-1">智能管理社群生命周期，识别高价值成员并安全迁移</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '活跃期社群', value: groups.filter((g) => g.lifecycle === 'active').length, color: 'success', icon: Shield },
          { label: '即将到期', value: expiringGroups.filter((g) => g.daysLeft <= 14 && g.daysLeft > 0).length, color: 'warning', icon: Clock },
          { label: '已超期', value: expiringGroups.filter((g) => g.daysLeft <= 0).length, color: 'danger', icon: AlertTriangle },
          { label: '已归档', value: archivedGroups.length, color: 'ink', icon: Archive },
        ].map((m) => {
          const cMap: Record<string, string> = { success: '#10B981', warning: '#F59E0B', danger: '#EF4444', ink: '#6B7280' };
          return (
            <div key={m.label} className="data-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cMap[m.color] + '15', color: cMap[m.color] }}>
                  <m.icon size={16} />
                </div>
                <span className="font-display font-bold text-2xl text-ink-900">{m.value}</span>
              </div>
              <div className="text-xs text-ink-500">{m.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="data-card p-5 col-span-2">
          <h3 className="section-title mb-4">社群生命周期分布</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifecycleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {lifecycleData.map((e, i) => <Bar key={i} dataKey="count" fill={e.fill} radius={[6, 6, 0, 0]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="data-card p-5">
          <h3 className="section-title mb-4">迁移价值评估</h3>
          <div className="space-y-4">
            {[
              { label: '待识别高价值成员', value: highValueMembers.length, color: 'text-accent-600', bg: 'bg-accent-50' },
              { label: '本季已完成迁移', value: 286, color: 'text-brand-600', bg: 'bg-brand-50' },
              { label: '迁移后活跃率提升', value: '+18.5%', color: 'text-success-600', bg: 'bg-success-50' },
            ].map((m) => (
              <div key={m.label} className={cn('p-3 rounded-xl', m.bg)}>
                <div className="text-[10px] text-ink-500 uppercase tracking-wider font-medium">{m.label}</div>
                <div className={cn('font-display font-bold text-xl mt-1', m.color)}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-ink-200">
        {[
          { key: 'expiring', label: '到期预警', icon: Clock, badge: expiringGroups.length },
          { key: 'migrate', label: '成员迁移', icon: Users, badge: highValueMembers.length },
          { key: 'archived', label: '已归档社群', icon: Archive, badge: archivedGroups.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all relative',
              activeTab === t.key ? 'text-accent-600' : 'text-ink-500 hover:text-ink-700'
            )}
          >
            <t.icon size={14} />
            {t.label}
            {t.badge > 0 && (
              <span className={cn(
                'chip text-[10px]',
                activeTab === t.key ? 'bg-accent-500 text-white' : 'bg-ink-100 text-ink-500'
              )}>{t.badge}</span>
            )}
            {activeTab === t.key && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-500 rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'expiring' && (
        <div className="data-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-50/70 border-b border-ink-100">
              <tr>
                <th className="table-header pl-5">社群名称</th>
                <th className="table-header">类型</th>
                <th className="table-header">生命周期</th>
                <th className="table-header text-right">成员数</th>
                <th className="table-header text-right">高价值成员</th>
                <th className="table-header">到期时间</th>
                <th className="table-header">剩余天数</th>
                <th className="table-header">建议操作</th>
                <th className="table-header text-right pr-5">执行</th>
              </tr>
            </thead>
            <tbody>
              {expiringGroups.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-ink-400 text-sm">🎉 当前无即将到期的社群</td></tr>
              ) : expiringGroups.map((g) => (
                <ExpiringRow key={g.id} group={g} onSelect={() => { setSelectedGroup(g.id); setActiveTab('migrate'); }} onArchive={() => archiveGroup(g.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'migrate' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="data-card p-5 overflow-hidden flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title flex items-center gap-1.5"><AlertTriangle size={15} className="text-warning-500" />源社群</h3>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {expiringGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border-2 transition-all',
                    g.id === selectedGroup
                      ? 'border-accent-500 bg-accent-50/40 shadow-sm'
                      : 'border-ink-100 hover:border-ink-200 bg-white hover:bg-ink-50/30'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={g.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink-900 truncate">{g.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn('chip text-[10px]', GROUP_TYPE_COLORS[g.type].bg, GROUP_TYPE_COLORS[g.type].text)}>{g.typeLabel}</span>
                        <span className="text-[10px] text-ink-400">{g.daysLeft <= 0 ? '已超期' : `还剩 ${g.daysLeft} 天`}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="data-card p-5 col-span-2 flex flex-col max-h-[600px]">
            {current ? (
              <>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-ink-100">
                  <div>
                    <h3 className="section-title flex items-center gap-2">
                      <Trophy size={16} className="text-warning-500" />高价值成员待迁移
                    </h3>
                    <p className="section-subtitle">
                      「{current.name}」识别到 <span className="font-semibold text-ink-900">{current.highValueCount}</span> 名高价值成员，
                      建议迁移到活跃社群
                    </p>
                  </div>
                  <button className="btn-primary btn-sm"><Send size={13} />一键迁移全部</button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="mb-3">
                    <div className="text-xs font-medium text-ink-700 mb-2 flex items-center gap-1.5">
                      <Calendar size={12} className="text-accent-500" />选择目标社群
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {migrateTargets.slice(0, 5).map((t) => (
                        <button key={t.id} className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-accent-200 bg-accent-50 text-accent-700 text-xs font-medium flex items-center gap-1.5 hover:border-accent-400 transition-all">
                          <CheckCircle size={11} />{t.name}
                          <span className="text-[10px] opacity-70">({t.memberCount}人)</span>
                        </button>
                      ))}
                      <button className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-dashed border-ink-200 text-ink-500 text-xs hover:border-ink-300 hover:text-ink-700 transition-all">
                        + 新建目标群
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-ink-100 rounded-xl">
                    <table className="w-full">
                      <thead className="bg-ink-50/70 sticky top-0 backdrop-blur">
                        <tr>
                          <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-3 py-2.5">成员</th>
                          <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-3 py-2.5">价值分</th>
                          <th className="text-right text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-3 py-2.5">累计消费</th>
                          <th className="text-right text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-3 py-2.5">互动分</th>
                          <th className="text-right text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-3 py-2.5 pr-5">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membersOfSelected.map((m: HighValueMember) => (
                          <tr key={m.id} className="border-b border-ink-50 hover:bg-ink-50/40 last:border-0">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar name={m.nickname} size="sm" />
                                <div>
                                  <div className="text-xs font-medium text-ink-800">{m.nickname}</div>
                                  <div className="text-[10px] text-ink-400">{m.groupName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-display font-bold text-warning-600 text-sm">{m.valueScore}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs font-display font-semibold text-accent-600">{formatCurrency(m.consumptionTotal)}</td>
                            <td className="px-3 py-2.5 text-right text-xs text-ink-700">{m.interactionScore}</td>
                            <td className="px-3 py-2.5 text-right pr-5">
                              <button className="text-xs text-accent-600 font-medium hover:text-accent-700 flex items-center gap-0.5 justify-end ml-auto">
                                单独迁移 <ArrowRight size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-ink-400 text-sm">请从左侧选择需要处理的社群</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'archived' && (
        <div className="data-card overflow-hidden">
          {archivedGroups.length === 0 ? (
            <div className="py-20 text-center">
              <Archive size={36} className="mx-auto text-ink-200 mb-3" />
              <div className="text-ink-400 text-sm">暂无已归档社群</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-ink-50/70 border-b border-ink-100">
                <tr>
                  <th className="table-header pl-5">社群名称</th>
                  <th className="table-header">类型</th>
                  <th className="table-header text-right">成员数</th>
                  <th className="table-header">创建时间</th>
                  <th className="table-header">归档时间</th>
                  <th className="table-header text-right pr-5">操作</th>
                </tr>
              </thead>
              <tbody>
                {archivedGroups.map((g) => (
                  <tr key={g.id} className="table-row opacity-75">
                    <td className="table-cell pl-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={g.name} size="sm" />
                        <div>
                          <div className="font-medium text-ink-700">{g.name}</div>
                          <div className="text-[11px] text-ink-400">{g.description?.slice(0, 30)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge', GROUP_TYPE_COLORS[g.type].bg, GROUP_TYPE_COLORS[g.type].text)}>{g.typeLabel}</span>
                    </td>
                    <td className="table-cell text-right font-display font-semibold text-ink-600">{g.memberCount}</td>
                    <td className="table-cell text-xs text-ink-500">{formatDate(g.createdAt)}</td>
                    <td className="table-cell text-xs text-ink-500">{formatDate(g.expireAt)}</td>
                    <td className="table-cell text-right pr-5">
                      <div className="flex justify-end gap-2">
                        <button className="btn-ghost btn-sm text-xs">查看详情</button>
                        <button className="btn-secondary btn-sm text-xs"><ChevronRight size={12} />恢复</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function ExpiringRow({ group, onSelect, onArchive }: {
  group: ExpiringGroup; onSelect: () => void; onArchive: () => void;
}) {
  const actionMap: Record<ExpiringGroup['suggestedAction'], { label: string; color: string; handler: () => void }> = {
    migrate: { label: '执行迁移', color: 'bg-accent-500 hover:bg-accent-600', handler: onSelect },
    extend: { label: '延期续期', color: 'bg-brand-500 hover:bg-brand-600', handler: onSelect },
    archive: { label: '立即归档', color: 'bg-ink-500 hover:bg-ink-600', handler: onArchive },
  };
  const action = actionMap[group.suggestedAction];

  return (
    <tr className="table-row">
      <td className="table-cell pl-5">
        <div className="flex items-center gap-2.5">
          <Avatar name={group.name} size="sm" />
          <div>
            <div className="font-medium text-ink-900">{group.name}</div>
          </div>
        </div>
      </td>
      <td className="table-cell">
        <span className={cn('badge', GROUP_TYPE_COLORS[group.type].bg, GROUP_TYPE_COLORS[group.type].text)}>{group.typeLabel}</span>
      </td>
      <td className="table-cell">
        <span className={cn('badge', LIFECYCLE_COLORS[group.lifecycle])}>{LIFECYCLE_LABELS[group.lifecycle]}</span>
      </td>
      <td className="table-cell text-right font-display font-semibold">{group.memberCount}</td>
      <td className="table-cell text-right">
        <span className="text-xs font-semibold text-warning-600 flex items-center justify-end gap-1">
          <Trophy size={11} />{group.highValueCount}
        </span>
      </td>
      <td className="table-cell text-xs text-ink-600">{formatDate(group.expireAt)}</td>
      <td className="table-cell">
        <span className={cn(
          'chip font-mono font-semibold',
          group.daysLeft <= 0 ? 'bg-danger-100 text-danger-700' :
          group.daysLeft <= 3 ? 'bg-danger-50 text-danger-600' :
          group.daysLeft <= 7 ? 'bg-warning-100 text-warning-700' :
          'bg-brand-50 text-brand-600'
        )}>
          <Clock size={10} />
          {group.daysLeft <= 0 ? '已超期' : `${group.daysLeft}天`}
        </span>
      </td>
      <td className="table-cell">
        <span className={cn(
          'chip',
          group.suggestedAction === 'migrate' ? 'bg-accent-50 text-accent-700' :
          group.suggestedAction === 'extend' ? 'bg-brand-50 text-brand-700' :
          'bg-ink-50 text-ink-600'
        )}>
          {group.suggestedAction === 'migrate' ? '建议迁移' : group.suggestedAction === 'extend' ? '建议续期' : '建议归档'}
        </span>
      </td>
      <td className="table-cell text-right pr-5">
        <button
          onClick={action.handler}
          className={cn('text-white text-xs px-2.5 py-1.5 rounded-md font-medium transition-all hover:shadow-md', action.color)}
        >{action.label}</button>
      </td>
    </tr>
  );
}
