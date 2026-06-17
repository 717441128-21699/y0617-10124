
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit3, Search, Power, Save, X, ChevronDown, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber } from '@/utils/format';
import {
  ALERT_PRIORITY_COLORS, ALERT_PRIORITY_LABELS, KEYWORD_GROUP_COLORS, KEYWORD_GROUP_LABELS,
} from '@/utils/constants';
import type { Keyword, AlertPriority, KeywordGroupType } from '@/types';

const GROUPS: KeywordGroupType[] = ['complaint', 'refund', 'purchase', 'competitor', 'sensitive', 'custom'];
const MATCH_TYPES = [
  { value: 'contains', label: '包含匹配' },
  { value: 'exact', label: '精确匹配' },
  { value: 'regex', label: '正则匹配' },
];

export function KeywordsConfigPage() {
  const navigate = useNavigate();
  const { keywords, addKeyword, deleteKeyword, toggleKeyword } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<KeywordGroupType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = keywords.filter((k) => {
    if (search && !k.word.includes(search) && !k.groupLabel.includes(search)) return false;
    if (activeGroup !== 'all' && k.groupType !== activeGroup) return false;
    return true;
  });

  const totalTriggers = keywords.reduce((s, k) => s + k.triggerCount, 0);
  const enabledCount = keywords.filter((k) => k.enabled).length;

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Link to="/alerts" className="flex items-center gap-1 hover:text-accent-600"><ArrowLeft size={14} />返回告警中心</Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight">关键词配置</h1>
          <p className="text-sm text-ink-500 mt-1">
            共 <span className="font-semibold text-ink-900">{keywords.length}</span> 个关键词，
            已启用 <span className="font-semibold text-accent-600">{enabledCount}</span>，
            累计触发 <span className="font-semibold text-warning-600">{formatNumber(totalTriggers)}</span> 次
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus size={14} />新增关键词</button>
      </div>

      <div className="grid grid-cols-7 gap-3">
        <button
          onClick={() => setActiveGroup('all')}
          className={cn(
            'data-card p-3.5 text-left transition-all',
            activeGroup === 'all' && 'ring-2 ring-accent-500 shadow-card-hover'
          )}
        >
          <div className="font-display font-bold text-xl text-ink-900 mb-1">{keywords.length}</div>
          <div className="text-xs text-ink-500">全部关键词</div>
        </button>
        {GROUPS.map((g) => {
          const list = keywords.filter((k) => k.groupType === g);
          const triggers = list.reduce((s, k) => s + k.triggerCount, 0);
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn(
                'data-card p-3.5 text-left transition-all relative overflow-hidden',
                activeGroup === g && 'ring-2 ring-accent-500 shadow-card-hover'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn('chip', KEYWORD_GROUP_COLORS[g].bg, KEYWORD_GROUP_COLORS[g].text)}>
                  {KEYWORD_GROUP_LABELS[g]}
                </span>
                <BarChart3 size={12} className="text-ink-300" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-display font-bold text-lg text-ink-900">{list.length}</span>
                <span className="text-[10px] text-warning-600 font-medium">{formatNumber(triggers)}次</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="data-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索关键词..." className="input-base pl-9 h-9" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-500 ml-auto">
            <span>点击开关按钮可启用/停用关键词</span>
          </div>
        </div>
      </div>

      <div className="data-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink-50/70 border-b border-ink-100">
            <tr>
              <th className="table-header pl-5 w-16">启用</th>
              <th className="table-header">关键词</th>
              <th className="table-header">分组</th>
              <th className="table-header">匹配方式</th>
              <th className="table-header">优先级</th>
              <th className="table-header text-right">触发次数</th>
              <th className="table-header text-right pr-5">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((kw) => (
              <KeywordRow key={kw.id} keyword={kw} onToggle={toggleKeyword} onDelete={deleteKeyword} />
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center text-ink-400 text-sm">暂无匹配关键词</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && <CreateKeywordModal onClose={() => setShowModal(false)} onCreate={addKeyword} />}
    </div>
  );
}

function KeywordRow({ keyword, onToggle, onDelete }: {
  keyword: Keyword; onToggle: (id: string) => void; onDelete: (id: string) => void;
}) {
  return (
    <tr className={cn('table-row', !keyword.enabled && 'opacity-50')}>
      <td className="table-cell pl-5">
        <button
          onClick={() => onToggle(keyword.id)}
          className={cn(
            'relative w-10 h-5.5 rounded-full transition-colors',
            keyword.enabled ? 'bg-accent-500' : 'bg-ink-200'
          )}
          style={{ height: '22px' }}
        >
          <span className={cn(
            'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform flex items-center justify-center',
            keyword.enabled ? 'translate-x-5' : 'translate-x-0.5'
          )} style={{ width: '18px', height: '18px' }}>
            <Power size={9} className={keyword.enabled ? 'text-accent-500' : 'text-ink-400'} />
          </span>
        </button>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 rounded-md bg-ink-50 text-sm font-medium text-ink-800 border border-ink-100 font-mono">
            {keyword.word}
          </code>
        </div>
      </td>
      <td className="table-cell">
        <span className={cn('badge', KEYWORD_GROUP_COLORS[keyword.groupType].bg, KEYWORD_GROUP_COLORS[keyword.groupType].text)}>
          {keyword.groupLabel}
        </span>
      </td>
      <td className="table-cell">
        <span className="chip bg-brand-50 text-brand-600 border border-brand-100">
          {MATCH_TYPES.find((m) => m.value === keyword.matchType)?.label}
        </span>
      </td>
      <td className="table-cell">
        <span className={cn('badge flex items-center gap-1', ALERT_PRIORITY_COLORS[keyword.priority].badge)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', ALERT_PRIORITY_COLORS[keyword.priority].dot)} />
          {ALERT_PRIORITY_LABELS[keyword.priority]}
        </span>
      </td>
      <td className="table-cell text-right">
        <span className={cn(
          'font-display font-bold',
          keyword.triggerCount > 50 ? 'text-danger-600' : keyword.triggerCount > 10 ? 'text-warning-600' : 'text-ink-600'
        )}>
          {keyword.triggerCount}
        </span>
      </td>
      <td className="table-cell text-right pr-5">
        <div className="flex justify-end gap-0.5">
          <button className="btn-ghost btn-sm !p-1.5" title="编辑"><Edit3 size={13} /></button>
          <button onClick={() => onDelete(keyword.id)} className="btn-ghost btn-sm !p-1.5 text-danger-500" title="删除"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

function CreateKeywordModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (k: Omit<Keyword, 'id' | 'triggerCount'>) => void;
}) {
  const [word, setWord] = useState('');
  const [group, setGroup] = useState<KeywordGroupType>('complaint');
  const [matchType, setMatchType] = useState<Keyword['matchType']>('contains');
  const [priority, setPriority] = useState<AlertPriority>('medium');

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink-900">新增监控关键词</h3>
          <button onClick={onClose} className="btn-ghost btn-sm !p-1.5"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">关键词 / 正则表达式</label>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={matchType === 'regex' ? '例：(?:违规|刷单)\\d+' : '例：退款'}
              className="input-base font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-2">所属分组</label>
            <div className="grid grid-cols-3 gap-2">
              {GROUPS.map((g) => (
                <button key={g} onClick={() => setGroup(g)} className={cn(
                  'p-2 rounded-lg border text-xs font-medium transition-all text-center',
                  group === g ? `${KEYWORD_GROUP_COLORS[g].bg} ${KEYWORD_GROUP_COLORS[g].text} border-transparent` : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                )}>
                  {KEYWORD_GROUP_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">匹配方式</label>
              <select value={matchType} onChange={(e) => setMatchType(e.target.value as any)} className="input-base">
                {MATCH_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">告警优先级</label>
              <div className="relative">
                <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="input-base pr-8 appearance-none">
                  {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                    <option key={p} value={p}>{ALERT_PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary btn-sm">取消</button>
          <button
            onClick={() => {
              if (!word.trim()) return;
              onCreate({
                word: word.trim(), groupType: group, groupLabel: KEYWORD_GROUP_LABELS[group],
                matchType, priority, enabled: true,
              });
              onClose();
            }}
            className="btn-primary btn-sm"
          ><Save size={13} />添加关键词</button>
        </div>
      </div>
    </div>
  );
}
