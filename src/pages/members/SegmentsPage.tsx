
import { useState } from 'react';
import {
  Plus, Users, Filter, Send, Download, Trash2, Edit3, Save, X, Target, Sparkles, ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber, formatCurrency } from '@/utils/format';
import { TAG_CATEGORY_COLORS, TAG_CATEGORY_LABELS, MEMBER_STATUS_COLORS, MEMBER_STATUS_LABELS } from '@/utils/constants';
import type { Member } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface Segment {
  id: string; name: string; description: string;
  tagIds: string[]; minConsumption?: number; maxDaysInactive?: number;
  memberCount: number; totalValue: number; createdAt: string; color: string;
}

const PRESET_COLORS = ['#0D9488', '#2A6FF5', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899'];

const PRESET_SEGMENTS: Segment[] = [
  { id: 's1', name: '高价值沉睡客户', description: '累计消费≥2000元但30天未发言的成员', tagIds: [], minConsumption: 2000, maxDaysInactive: 30, memberCount: 386, totalValue: 1825600, createdAt: '2025-06-01', color: '#F59E0B' },
  { id: 's2', name: '新客首单转化群', description: '入群7天内且未下单的新用户', tagIds: [], minConsumption: 0, memberCount: 1205, totalValue: 0, createdAt: '2025-06-05', color: '#2A6FF5' },
  { id: 's3', name: '超级KOC达人', description: '互动分≥500且消费≥3次的意见领袖', tagIds: [], memberCount: 58, totalValue: 428800, createdAt: '2025-05-20', color: '#0D9488' },
  { id: 's4', name: 'VIP会员专享', description: '会员等级V2以上所有成员', tagIds: [], memberCount: 892, totalValue: 6583200, createdAt: '2025-04-10', color: '#8B5CF6' },
];

export function SegmentsPage() {
  const { members, tags } = useAppStore();
  const [segments, setSegments] = useState<Segment[]>(PRESET_SEGMENTS);
  const [selected, setSelected] = useState<string>(segments[0].id);
  const [showModal, setShowModal] = useState(false);

  const current = segments.find((s) => s.id === selected);

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight flex items-center gap-2">
            <Target size={22} className="text-brand-500" />人群包管理
          </h1>
          <p className="text-sm text-ink-500 mt-1">通过多条件组合圈选目标人群，实现精准触达</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm"><Download size={14} />导出全部</button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus size={14} />新建人群包</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {segments.map((seg) => {
          const active = seg.id === selected;
          return (
            <button
              key={seg.id}
              onClick={() => setSelected(seg.id)}
              className={cn(
                'data-card p-4 text-left transition-all group relative overflow-hidden',
                active && 'ring-2 shadow-card-hover'
              )}
              style={active ? { borderColor: seg.color } : undefined}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: seg.color }} />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: seg.color + '15', color: seg.color }}>
                  <Users size={16} />
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="btn-ghost btn-sm !p-1" title="编辑"><Edit3 size={12} /></button>
                  <button className="btn-ghost btn-sm !p-1 text-danger-500" title="删除"><Trash2 size={12} /></button>
                </div>
              </div>
              <h3 className="font-display font-semibold text-ink-900 mb-1">{seg.name}</h3>
              <p className="text-[11px] text-ink-400 leading-relaxed line-clamp-2 mb-3">{seg.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-xl text-ink-900">{formatNumber(seg.memberCount)}</div>
                  <div className="text-[10px] text-ink-400">覆盖人数</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold" style={{ color: seg.color }}>{formatCurrency(seg.totalValue)}</div>
                  <div className="text-[10px] text-ink-400">消费价值</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {current ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="data-card p-5 col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title flex items-center gap-1.5"><Filter size={15} />筛选条件</h3>
              <button className="text-xs text-accent-600 font-medium hover:text-accent-700">编辑条件</button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-2">包含标签</div>
                {current.tagIds.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {current.tagIds.map((tid) => {
                      const t = tags.find((x) => x.id === tid);
                      return t ? (
                        <span key={tid} className="chip border px-2 py-1" style={{ borderColor: t.color + '40', background: t.color + '10', color: t.color }}>{t.name}</span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-ink-400">未设置</div>
                )}
              </div>
              <div className="pt-3 border-t border-ink-100 space-y-2.5">
                <CondRow label="累计消费" value={current.minConsumption !== undefined ? `≥ ${formatCurrency(current.minConsumption)}` : '不限'} />
                <CondRow label="未活跃天数" value={current.maxDaysInactive ? `≤ ${current.maxDaysInactive} 天` : '不限'} />
                <CondRow label="创建时间" value={current.createdAt} />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-ink-100 space-y-2">
              <button className="btn-primary w-full"><Send size={14} />发送定向消息</button>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary btn-sm"><Sparkles size={12} />自动打标</button>
                <button className="btn-secondary btn-sm"><Download size={12} />导出名单</button>
              </div>
            </div>
          </div>

          <div className="data-card col-span-2 overflow-hidden flex flex-col max-h-[600px]">
            <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
              <div>
                <div className="section-title">人群成员预览</div>
                <div className="text-[11px] text-ink-400 mt-0.5">共 <span className="font-semibold text-ink-700">{formatNumber(current.memberCount)}</span> 名成员，展示前 30 条</div>
              </div>
              <button className="btn-secondary btn-sm">查看全部 <ChevronRight size={12} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-ink-50/70 sticky top-0">
                  <tr>
                    <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-4 py-2.5">成员</th>
                    <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-4 py-2.5">所在群</th>
                    <th className="text-right text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-4 py-2.5">消费金额</th>
                    <th className="text-right text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-4 py-2.5">价值分</th>
                    <th className="text-left text-[11px] font-semibold text-ink-500 uppercase tracking-wider px-4 py-2.5">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {members.slice(0, 30).map((m: Member) => (
                    <tr key={m.id} className="border-b border-ink-50 hover:bg-ink-50/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.nickname} size="sm" />
                          <div>
                            <div className="text-xs font-medium text-ink-800">{m.nickname}</div>
                            <div className="flex gap-1 mt-0.5">
                              {m.tags.slice(0, 2).map((tid, i) => {
                                const t = tags.find((x) => x.id === tid);
                                return t ? (
                                  <span key={i} className="chip text-[9px] px-1.5" style={{ background: t.color + '15', color: t.color }}>{t.name}</span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-ink-600">{m.groupName}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-display font-semibold text-accent-600">{formatCurrency(m.consumptionTotal)}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-display font-bold text-brand-600">{m.valueScore}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('badge text-[10px] !py-0', MEMBER_STATUS_COLORS[m.status])}>{MEMBER_STATUS_LABELS[m.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {showModal && <CreateSegmentModal onClose={() => setShowModal(false)} onCreate={(s) => { setSegments([s, ...segments]); setShowModal(false); }} tags={tags} />}
    </div>
  );
}

function CondRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800">{value}</span>
    </div>
  );
}

function CreateSegmentModal({ onClose, onCreate, tags }: {
  onClose: () => void;
  onCreate: (s: Segment) => void;
  tags: any[];
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selTags, setSelTags] = useState<string[]>([]);
  const color = PRESET_COLORS[0];
  const toggle = (id: string) => setSelTags((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-xl overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink-900">新建人群包</h3>
          <button onClick={onClose} className="btn-ghost btn-sm !p-1.5"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-700 mb-1.5">人群包名称</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：618高意向购买人群" className="input-base" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-700 mb-1.5">描述说明</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="input-base min-h-[60px] resize-none" placeholder="简要说明筛选条件和运营目的..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-2">标签圈选条件</label>
            <div className="space-y-2">
              {(['attribute', 'behavior', 'consumption'] as const).map((cat) => {
                const list = tags.filter((t) => t.category === cat);
                return (
                  <div key={cat} className="p-3 rounded-xl border border-ink-100">
                    <div className={cn('chip mb-2', TAG_CATEGORY_COLORS[cat])}>{TAG_CATEGORY_LABELS[cat]}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((t) => (
                        <button key={t.id} onClick={() => toggle(t.id)} className={cn(
                          'px-2 py-1 rounded-md text-xs font-medium transition-all border',
                          selTags.includes(t.id) ? 'text-white border-transparent' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                        )} style={selTags.includes(t.id) ? { background: t.color, borderColor: t.color } : undefined}>
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary btn-sm">取消</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onCreate({
                id: 's_' + Date.now(),
                name: name.trim(), description: desc || '自定义人群包',
                tagIds: selTags, memberCount: Math.floor(Math.random() * 2000) + 200,
                totalValue: Math.floor(Math.random() * 5000000),
                createdAt: new Date().toISOString().slice(0, 10), color,
              });
            }}
            className="btn-primary btn-sm"
          ><Save size={13} />创建人群包</button>
        </div>
      </div>
    </div>
  );
}
