
import { useState } from 'react';
import { Plus, Trash2, Edit3, Sparkles, Save, X, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber } from '@/utils/format';
import { TAG_CATEGORY_COLORS, TAG_CATEGORY_LABELS } from '@/utils/constants';
import type { MemberTag, TagCategory, AutoTagRule } from '@/types';

const CATEGORIES: TagCategory[] = ['attribute', 'behavior', 'consumption'];
const TAG_COLOR_PALETTE = ['#0D9488', '#2A6FF5', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#10B981', '#EC4899', '#6366F1'];

export function TagsManagePage() {
  const { tags, addTag, deleteTag } = useAppStore();
  const [activeCat, setActiveCat] = useState<TagCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = tags.filter((t) => activeCat === 'all' || t.category === activeCat);

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight">标签库管理</h1>
          <p className="text-sm text-ink-500 mt-1">共 <span className="font-semibold text-ink-900">{tags.length}</span> 个标签，覆盖 <span className="font-semibold">{formatNumber(tags.reduce((s, t) => s + t.memberCount, 0))}</span> 人次</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus size={14} />新建标签</button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveCat('all')}
          className={cn('px-4 h-9 rounded-lg text-sm font-medium transition-all',
            activeCat === 'all' ? 'bg-accent-600 text-white shadow-sm' : 'bg-white text-ink-600 hover:bg-ink-50 border border-ink-200')}
        >全部标签 ({tags.length})</button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={cn('px-4 h-9 rounded-lg text-sm font-medium transition-all border',
              activeCat === cat
                ? `${TAG_CATEGORY_COLORS[cat]} border-transparent shadow-sm`
                : 'bg-white text-ink-600 hover:bg-ink-50 border-ink-200')}
          >
            {TAG_CATEGORY_LABELS[cat]} ({tags.filter((t) => t.category === cat).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.filter((c) => activeCat === 'all' || activeCat === c).map((cat) => {
          const list = tags.filter((t) => t.category === cat);
          return (
            <div key={cat} className="data-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn('badge', TAG_CATEGORY_COLORS[cat])}>{TAG_CATEGORY_LABELS[cat]}</span>
                  <span className="text-[11px] text-ink-400">{list.length} 个标签</span>
                </div>
                <button onClick={() => setShowModal(true)} className="text-xs text-accent-600 font-medium hover:text-accent-700">+ 新建</button>
              </div>
              <div className="space-y-2">
                {list.map((tag) => (
                  <TagItem key={tag.id} tag={tag} onDelete={deleteTag} />
                ))}
                {list.length === 0 && (
                  <div className="py-8 text-center text-ink-400 text-sm">暂无标签</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <CreateTagModal onClose={() => setShowModal(false)} onCreate={addTag} />}
    </div>
  );
}

function TagItem({ tag, onDelete }: { tag: MemberTag; onDelete: (id: string) => void }) {
  const [showRule, setShowRule] = useState(false);
  return (
    <div className={cn(
      'p-3 rounded-xl border transition-all group',
      tag.autoRule ? 'border-ink-100 hover:border-accent-200 bg-white' : 'border-dashed border-ink-200 hover:border-ink-300 bg-ink-50/40'
    )}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tag.color + '15', color: tag.color }}>
          <span className="font-bold text-sm">#</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-ink-900">{tag.name}</span>
            {tag.autoRule && (
              <span className="chip bg-accent-50 text-accent-600 flex items-center gap-0.5">
                <Sparkles size={9} />自动
              </span>
            )}
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">{formatNumber(tag.memberCount)} 名成员</div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {tag.autoRule && (
            <button onClick={() => setShowRule(!showRule)} className="btn-ghost btn-sm !p-1.5" title="查看规则">
              <ChevronDown size={13} className={cn(showRule && 'rotate-180 transition-transform')} />
            </button>
          )}
          <button className="btn-ghost btn-sm !p-1.5" title="编辑"><Edit3 size={13} /></button>
          <button onClick={() => onDelete(tag.id)} className="btn-ghost btn-sm !p-1.5 text-danger-500" title="删除"><Trash2 size={13} /></button>
        </div>
      </div>
      {tag.autoRule && showRule && (
        <div className="mt-3 ml-11 p-2.5 rounded-lg bg-ink-50 text-xs text-ink-600 border border-ink-100 animate-fade-in">
          <RuleDisplay rule={tag.autoRule} />
        </div>
      )}
    </div>
  );
}

function RuleDisplay({ rule }: { rule: AutoTagRule }) {
  const FIELD_LABELS: Record<AutoTagRule['field'], string> = {
    join_days: '入群天数', consumption_total: '累计消费', message_count: '发言数量', last_active_days: '未活跃天数',
  };
  const OP_LABELS: Record<AutoTagRule['operator'], string> = {
    '>': '大于', '<': '小于', '>=': '大于等于', '<=': '小于等于', '==': '等于', 'between': '介于',
  };
  const UNIT: Record<AutoTagRule['field'], string> = {
    join_days: '天', consumption_total: '元', message_count: '条', last_active_days: '天',
  };
  return (
    <span>
      当 <span className="font-semibold text-ink-800">{FIELD_LABELS[rule.field]}</span>
      {' '}{OP_LABELS[rule.operator]}{' '}
      <span className="font-semibold text-accent-700">
        {Array.isArray(rule.value) ? `${rule.value[0]} - ${rule.value[1]}` : rule.value}
      </span>{' '}
      {UNIT[rule.field]} 时，自动打此标签
    </span>
  );
}

function CreateTagModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (t: Omit<MemberTag, 'id' | 'memberCount'>) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TagCategory>('attribute');
  const [color, setColor] = useState(TAG_COLOR_PALETTE[0]);
  const [auto, setAuto] = useState(false);
  const [ruleField, setRuleField] = useState<AutoTagRule['field']>('consumption_total');
  const [ruleOp, setRuleOp] = useState<AutoTagRule['operator']>('>=');
  const [ruleValue, setRuleValue] = useState(500);

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink-900">新建成员标签</h3>
          <button onClick={onClose} className="btn-ghost btn-sm !p-1.5"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">标签名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：高价值客户" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">所属分类</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={cn(
                  'p-2.5 rounded-lg border text-xs font-medium transition-all text-center',
                  category === c ? `${TAG_CATEGORY_COLORS[c]} border-transparent` : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                )}>{TAG_CATEGORY_LABELS[c]}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-2">标签颜色</label>
            <div className="flex gap-1.5 flex-wrap">
              {TAG_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-lg transition-all', color === c ? 'ring-2 ring-offset-2 ring-ink-900 scale-110' : 'hover:scale-105')}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-ink-50 border border-ink-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="text-accent-600 rounded" />
              <span className="text-xs font-medium text-ink-700 flex-1">启用自动打标规则</span>
              <Sparkles size={13} className="text-accent-500" />
            </label>
            {auto && (
              <div className="mt-3 pt-3 border-t border-ink-200 grid grid-cols-3 gap-2">
                <select value={ruleField} onChange={(e) => setRuleField(e.target.value as any)} className="input-base !py-1.5 text-xs col-span-1">
                  <option value="consumption_total">累计消费</option>
                  <option value="message_count">发言数量</option>
                  <option value="join_days">入群天数</option>
                  <option value="last_active_days">未活跃天数</option>
                </select>
                <select value={ruleOp} onChange={(e) => setRuleOp(e.target.value as any)} className="input-base !py-1.5 text-xs col-span-1">
                  {(['>=', '<=', '>', '<', '=='] as const).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <input type="number" value={ruleValue} onChange={(e) => setRuleValue(Number(e.target.value))} className="input-base !py-1.5 text-xs col-span-1" />
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary btn-sm">取消</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onCreate({
                name: name.trim(), category, categoryLabel: TAG_CATEGORY_LABELS[category], color,
                autoRule: auto ? { field: ruleField, operator: ruleOp, value: ruleValue } : undefined,
              });
              onClose();
            }}
            className="btn-primary btn-sm"
          ><Save size={13} />创建标签</button>
        </div>
      </div>
    </div>
  );
}
