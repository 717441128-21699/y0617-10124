
import { useState } from 'react';
import {
  Search, Plus, Filter, Download, Tag, ChevronDown, ArrowUpDown, Send, Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatCurrency, formatNumber } from '@/utils/format';
import {
  MEMBER_STATUS_COLORS, MEMBER_STATUS_LABELS, TAG_CATEGORY_COLORS, TAG_CATEGORY_LABELS,
} from '@/utils/constants';
import { formatDate, formatRelative } from '@/utils/date';
import type { Member, TagCategory } from '@/types';

type SortKey = 'valueScore' | 'consumptionTotal' | 'messageCount' | 'joinAt';

export function MembersListPage() {
  const { members, tags } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('valueScore');
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = members
    .filter((m) => {
      if (search && !m.nickname.toLowerCase().includes(search.toLowerCase()) && !m.groupName.includes(search)) return false;
      if (selectedTags.length && !selectedTags.every((t) => m.tags.includes(t))) return false;
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sort === 'joinAt') diff = new Date(a.joinAt).getTime() - new Date(b.joinAt).getTime();
      else diff = (a[sort] as number) - (b[sort] as number);
      return sortDesc ? -diff : diff;
    })
    .slice(0, 50);

  const toggleTag = (id: string) => setSelectedTags((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleSort = (k: SortKey) => {
    if (sort === k) setSortDesc(!sortDesc);
    else { setSort(k); setSortDesc(true); }
  };

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight">成员管理</h1>
          <p className="text-sm text-ink-500 mt-1">共 <span className="font-semibold text-ink-900">{formatNumber(members.length)}</span> 名成员，覆盖 <span className="font-semibold">{tags.length}</span> 个标签</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm"><Download size={14} />导出数据</button>
          <button className="btn-secondary btn-sm"><Tag size={14} />批量打标</button>
          {selected.length > 0 && (
            <button className="btn-primary btn-sm"><Send size={14} />群发消息 ({selected.length})</button>
          )}
        </div>
      </div>

      <div className="data-card p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索成员昵称、所属群..."
              className="input-base pl-9 h-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {tags.slice(0, 12).map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTag(t.id)}
                className={cn(
                  'px-2.5 h-7 rounded-full text-xs font-medium border transition-all flex items-center gap-1',
                  selectedTags.includes(t.id)
                    ? 'bg-accent-500 text-white border-accent-500'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                )}
                style={!selectedTags.includes(t.id) ? { borderColor: t.color + '40', color: t.color } : undefined}
              >
                {t.name}
              </button>
            ))}
            {tags.length > 12 && (
              <button className="px-2.5 h-7 rounded-full text-xs font-medium bg-ink-50 text-ink-500 flex items-center gap-1">
                更多 <ChevronDown size={11} />
              </button>
            )}
          </div>
          {selectedTags.length > 0 && (
            <button onClick={() => setSelectedTags([])} className="text-xs text-danger-600 font-medium hover:underline">
              清空筛选
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(['attribute', 'behavior', 'consumption'] as TagCategory[]).map((cat) => {
          const catTags = tags.filter((t) => t.category === cat);
          const totalMembers = catTags.reduce((s, t) => s + t.memberCount, 0);
          return (
            <div key={cat} className="data-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={cn('badge', TAG_CATEGORY_COLORS[cat])}>{TAG_CATEGORY_LABELS[cat]}</span>
                <span className="font-display font-bold text-lg text-ink-900">{catTags.length}</span>
              </div>
              <div className="text-[11px] text-ink-400">覆盖成员 {formatNumber(totalMembers)} 人次</div>
            </div>
          );
        })}
        <div className="data-card p-4 border-l-4 border-l-accent-500">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-accent-500" />
            <span className="text-xs font-semibold text-ink-700">高价值成员</span>
          </div>
          <div className="font-display font-bold text-2xl text-accent-600">
            {members.filter((m) => m.valueScore >= 80).length}
          </div>
          <div className="text-[11px] text-ink-400">价值分 ≥80 分</div>
        </div>
      </div>

      <div className="data-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-500">已筛选</span>
            <span className="font-semibold text-ink-900">{filtered.length}</span>
            <span className="text-ink-400">/ {members.length}</span>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-accent-600 font-medium">已选择 {selected.length} 人</span>
              <button onClick={() => setSelected([])} className="text-ink-400 hover:text-danger-600">取消</button>
            </div>
          )}
        </div>
        <table className="w-full">
          <thead className="bg-ink-50/70">
            <tr>
              <th className="table-header w-10"><input type="checkbox" className="rounded" /></th>
              <th className="table-header cursor-pointer" onClick={() => toggleSort('valueScore')}>
                <span className="flex items-center gap-1">成员 <ArrowUpDown size={11} /></span>
              </th>
              <th className="table-header">所在群</th>
              <th className="table-header">标签</th>
              <th className="table-header cursor-pointer hover:text-ink-700" onClick={() => toggleSort('consumptionTotal')}>
                <span className="flex items-center gap-1">消费金额 <ArrowUpDown size={11} /></span>
              </th>
              <th className="table-header cursor-pointer hover:text-ink-700" onClick={() => toggleSort('messageCount')}>
                <span className="flex items-center gap-1">发言数 <ArrowUpDown size={11} /></span>
              </th>
              <th className="table-header cursor-pointer hover:text-ink-700" onClick={() => toggleSort('valueScore')}>
                <span className="flex items-center gap-1">价值分 <ArrowUpDown size={11} /></span>
              </th>
              <th className="table-header">状态</th>
              <th className="table-header">最后活跃</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <MemberRow key={m.id} member={m} selected={selected.includes(m.id)} onToggle={() => toggleSelect(m.id)} allTags={tags} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberRow({ member, selected, onToggle, allTags }: {
  member: Member; selected: boolean; onToggle: () => void; allTags: any[];
}) {
  return (
    <tr className={cn('table-row', selected && 'bg-accent-50/40')}>
      <td className="table-cell pl-5">
        <input type="checkbox" className="rounded text-accent-600" checked={selected} onChange={onToggle} />
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-2.5">
          <Avatar name={member.nickname} size="sm" />
          <div>
            <div className="font-medium text-ink-900">{member.nickname}</div>
            <div className="text-[10px] text-ink-400">入群：{formatDate(member.joinAt)}</div>
          </div>
        </div>
      </td>
      <td className="table-cell">
        <span className="text-xs text-ink-600">{member.groupName}</span>
      </td>
      <td className="table-cell">
        <div className="flex gap-1 flex-wrap max-w-xs">
          {member.tags.slice(0, 3).map((tid) => {
            const t = allTags.find((x) => x.id === tid);
            return t ? (
              <span key={tid} className="chip border" style={{ borderColor: t.color + '40', background: t.color + '10', color: t.color }}>
                {t.name}
              </span>
            ) : null;
          })}
          {member.tags.length > 3 && (
            <span className="chip bg-ink-50 text-ink-500">+{member.tags.length - 3}</span>
          )}
        </div>
      </td>
      <td className="table-cell text-right">
        <span className="font-display font-semibold text-accent-600">{formatCurrency(member.consumptionTotal)}</span>
      </td>
      <td className="table-cell text-right font-mono text-ink-700">{member.messageCount}</td>
      <td className="table-cell text-right">
        <span className={cn(
          'font-display font-bold',
          member.valueScore >= 80 ? 'text-success-600' : member.valueScore >= 50 ? 'text-accent-600' : 'text-warning-600'
        )}>
          {member.valueScore}
        </span>
      </td>
      <td className="table-cell">
        <span className={cn('badge', MEMBER_STATUS_COLORS[member.status])}>{MEMBER_STATUS_LABELS[member.status]}</span>
      </td>
      <td className="table-cell text-xs text-ink-500">{formatRelative(member.lastActiveAt)}</td>
    </tr>
  );
}
