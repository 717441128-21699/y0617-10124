
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, List, LayoutGrid, Eye, Archive, Edit3, ChevronDown, ArrowRight, TrendingUp, Users } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatNumber, formatPercent, truncateText } from '@/utils/format';
import { GROUP_TYPE_COLORS, GROUP_TYPE_LABELS, LIFECYCLE_COLORS, LIFECYCLE_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/date';
import type { Group, GroupType, LifecyclePhase } from '@/types';

const TYPE_FILTERS: Array<{ value: GroupType | 'all'; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'new_customer', label: '新客群' },
  { value: 'paid_member', label: '付费会员群' },
  { value: 'trial', label: '体验群' },
  { value: 'vip', label: 'VIP群' },
];

const LIFECYCLE_FILTERS: Array<{ value: LifecyclePhase | 'all'; label: string }> = [
  { value: 'all', label: '全部阶段' },
  { value: 'preparation', label: '筹备期' },
  { value: 'active', label: '活跃期' },
  { value: 'declining', label: '衰退期' },
  { value: 'archived', label: '已归档' },
];

export function GroupsListPage() {
  const navigate = useNavigate();
  const { groups, archiveGroup } = useAppStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [typeFilter, setTypeFilter] = useState<GroupType | 'all'>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecyclePhase | 'all'>('all');

  const filtered = groups.filter((g) => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && g.type !== typeFilter) return false;
    if (lifecycleFilter !== 'all' && g.lifecycle !== lifecycleFilter) return false;
    return true;
  });

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight">社群管理中心</h1>
          <p className="text-sm text-ink-500 mt-1">共管理 <span className="font-semibold text-ink-900">{groups.length}</span> 个社群</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm">批量导入</button>
          <button className="btn-primary btn-sm"><Plus size={14} />新建社群</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(GROUP_TYPE_LABELS).map(([type, label]) => {
          const list = groups.filter((g) => g.type === type);
          const total = list.reduce((s, g) => s + g.memberCount, 0);
          return (
            <div key={type} className="data-card p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', GROUP_TYPE_COLORS[type as GroupType].bg)}>
                  <Users size={14} className={GROUP_TYPE_COLORS[type as GroupType].text} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-ink-600">{label}</div>
                  <div className="text-[10px] text-ink-400">{list.length} 个群</div>
                </div>
                <span className={cn('chip', GROUP_TYPE_COLORS[type as GroupType].bg, GROUP_TYPE_COLORS[type as GroupType].text)}>
                  <TrendingUp size={9} />
                  <span>{formatNumber(total)}人</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="data-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索群名称、负责人..."
              className="input-base pl-9 h-9"
            />
          </div>
          <div className="flex gap-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={cn(
                  'px-3 h-8 rounded-lg text-xs font-medium transition-all',
                  typeFilter === f.value ? 'bg-accent-600 text-white shadow-sm' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <button className="btn-secondary btn-sm flex items-center gap-1 h-9">
              <Filter size={13} />
              {LIFECYCLE_FILTERS.find((f) => f.value === lifecycleFilter)?.label}
              <ChevronDown size={13} />
            </button>
            <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-pop border border-ink-100 py-1 z-20 w-32 animate-fade-in">
              {LIFECYCLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setLifecycleFilter(f.value)}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs hover:bg-ink-50',
                    lifecycleFilter === f.value && 'text-accent-600 font-medium'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex bg-ink-50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={cn('p-1.5 rounded-md text-ink-500 transition-colors', viewMode === 'table' && 'bg-white text-accent-600 shadow-sm')}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={cn('p-1.5 rounded-md text-ink-500 transition-colors', viewMode === 'card' && 'bg-white text-accent-600 shadow-sm')}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="data-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-50/70 border-b border-ink-100">
              <tr>
                <th className="table-header">社群信息</th>
                <th className="table-header">类型</th>
                <th className="table-header">生命周期</th>
                <th className="table-header text-right">成员数</th>
                <th className="table-header text-right">7日活跃</th>
                <th className="table-header text-right">今日消息</th>
                <th className="table-header text-right">活跃率</th>
                <th className="table-header">到期时间</th>
                <th className="table-header">负责人</th>
                <th className="table-header text-right pr-5">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <GroupRow key={g.id} group={g} onArchive={archiveGroup} onOpen={() => navigate(`/groups/${g.id}`)} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-ink-400 text-sm">暂无匹配的社群</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GroupCard key={g.id} group={g} onArchive={archiveGroup} onOpen={() => navigate(`/groups/${g.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupRow({ group, onArchive, onOpen }: { group: Group; onArchive: (id: string) => void; onOpen: () => void }) {
  const activeRate = group.activeMembers7d / group.memberCount;
  return (
    <tr className="table-row group">
      <td className="table-cell">
        <div onClick={onOpen} className="flex items-center gap-2.5 cursor-pointer">
          <Avatar name={group.name} size="md" />
          <div>
            <div className="font-medium text-ink-900 group-hover:text-accent-600 transition-colors">{group.name}</div>
            <div className="text-[11px] text-ink-400">{truncateText(group.description, 30)}</div>
          </div>
        </div>
      </td>
      <td className="table-cell">
        <span className={cn('badge', GROUP_TYPE_COLORS[group.type].bg, GROUP_TYPE_COLORS[group.type].text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', GROUP_TYPE_COLORS[group.type].dot)} />
          {group.typeLabel}
        </span>
      </td>
      <td className="table-cell">
        <span className={cn('badge', LIFECYCLE_COLORS[group.lifecycle])}>{group.lifecycleLabel}</span>
      </td>
      <td className="table-cell text-right font-display font-semibold">{group.memberCount}</td>
      <td className="table-cell text-right">{group.activeMembers7d}</td>
      <td className="table-cell text-right">{group.messageCountToday}</td>
      <td className="table-cell text-right">
        <span className={cn(
          'font-display font-semibold',
          activeRate > 0.5 ? 'text-accent-600' : activeRate > 0.3 ? 'text-brand-600' : 'text-warning-600'
        )}>
          {formatPercent(activeRate, 0)}
        </span>
      </td>
      <td className="table-cell">
        <span className={cn('text-xs',
          group.status === 'expiring' ? 'text-danger-600 font-medium' :
          group.status === 'warning' ? 'text-warning-600 font-medium' : 'text-ink-600'
        )}>
          {formatDate(group.expireAt)}
        </span>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1.5">
          <Avatar name={group.owner} size="xs" />
          <span className="text-xs text-ink-600">{group.owner}</span>
        </div>
      </td>
      <td className="table-cell text-right pr-5">
        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onOpen} className="btn-ghost btn-sm !p-1.5" title="查看详情"><Eye size={14} /></button>
          <button className="btn-ghost btn-sm !p-1.5" title="编辑"><Edit3 size={14} /></button>
          {group.lifecycle !== 'archived' && (
            <button onClick={() => onArchive(group.id)} className="btn-ghost btn-sm !p-1.5 text-danger-500" title="归档"><Archive size={14} /></button>
          )}
        </div>
      </td>
    </tr>
  );
}

function GroupCard({ group, onArchive, onOpen }: { group: Group; onArchive: (id: string) => void; onOpen: () => void }) {
  const activeRate = group.activeMembers7d / group.memberCount;
  return (
    <div className="data-card p-5 hover:shadow-card-hover group">
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar name={group.name} size="lg" />
          <div>
            <h3 className="font-display font-semibold text-ink-900 group-hover:text-accent-600 cursor-pointer" onClick={onOpen}>{group.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn('badge text-[10px] !py-0', GROUP_TYPE_COLORS[group.type].bg, GROUP_TYPE_COLORS[group.type].text)}>
                {group.typeLabel}
              </span>
              <span className={cn('badge text-[10px] !py-0', LIFECYCLE_COLORS[group.lifecycle])}>{group.lifecycleLabel}</span>
            </div>
          </div>
        </div>
        <button onClick={onOpen} className="btn-ghost btn-sm !p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={14} />
        </button>
      </div>
      <p className="text-xs text-ink-500 mb-4 line-clamp-1">{group.description}</p>
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div>
          <div className="font-display font-bold text-ink-900">{group.memberCount}</div>
          <div className="text-[10px] text-ink-400 mt-0.5">成员数</div>
        </div>
        <div>
          <div className="font-display font-bold text-accent-600">{group.activeMembers7d}</div>
          <div className="text-[10px] text-ink-400 mt-0.5">7日活跃</div>
        </div>
        <div>
          <div className={cn('font-display font-bold', activeRate > 0.5 ? 'text-success-600' : 'text-warning-600')}>
            {formatPercent(activeRate, 0)}
          </div>
          <div className="text-[10px] text-ink-400 mt-0.5">活跃率</div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-ink-100">
        <div className="flex items-center gap-1.5">
          <Avatar name={group.owner} size="xs" />
          <span className="text-[11px] text-ink-500">{group.owner}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost btn-sm !p-1.5" title="编辑"><Edit3 size={13} /></button>
          {group.lifecycle !== 'archived' && (
            <button onClick={() => onArchive(group.id)} className="btn-ghost btn-sm !p-1.5 text-danger-500" title="归档"><Archive size={13} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
