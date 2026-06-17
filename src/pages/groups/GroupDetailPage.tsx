
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Users, MessageSquare, BarChart2, Settings, ChevronRight,
  Send, UserPlus, Archive, TrendingUp, Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatNumber, formatPercent, truncateText } from '@/utils/format';
import {
  GROUP_TYPE_COLORS, GROUP_TYPE_LABELS, LIFECYCLE_COLORS, LIFECYCLE_LABELS, MEMBER_STATUS_COLORS, MEMBER_STATUS_LABELS,
} from '@/utils/constants';
import { formatDate, formatDateTime, formatRelative } from '@/utils/date';
import type { GroupType, LifecyclePhase } from '@/types';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

type TabType = 'members' | 'messages' | 'analytics' | 'settings';

const OWNER_OPTIONS = [
  { value: '运营-李娜', label: '运营-李娜' },
  { value: '运营-王强', label: '运营-王强' },
  { value: '运营主管-赵敏', label: '运营主管-赵敏' },
  { value: '社群-刘洋', label: '社群-刘洋' },
];

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groups, members, updateGroup } = useAppStore();
  const [tab, setTab] = useState<TabType>('members');
  const [toast, setToast] = useState(false);
  const group = groups.find((g) => g.id === id);

  const [formName, setFormName] = useState(group?.name ?? '');
  const [formType, setFormType] = useState<GroupType>(group?.type ?? 'new_customer');
  const [formLifecycle, setFormLifecycle] = useState<LifecyclePhase>(group?.lifecycle ?? 'preparation');
  const [formExpireAt, setFormExpireAt] = useState(group?.expireAt ?? '');
  const [formOwner, setFormOwner] = useState(group?.owner ?? '');
  const [formDescription, setFormDescription] = useState(group?.description ?? '');

  if (!group) {
    return (
      <div className="page-container">
        <div className="data-card p-16 text-center text-ink-400">
          未找到该社群信息
          <button onClick={() => navigate('/groups')} className="btn-primary mt-4 block mx-auto">返回列表</button>
        </div>
      </div>
    );
  }

  const groupMembers = members.filter((m) => m.groupId === group.id);
  const messageTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      messages: Math.floor(Math.random() * 300) + 50,
    };
  });

  const activeRate = group.activeMembers7d / group.memberCount;

  const tabs: Array<{ key: TabType; label: string; icon: any }> = [
    { key: 'members', label: '成员列表', icon: Users },
    { key: 'messages', label: '消息记录', icon: MessageSquare },
    { key: 'analytics', label: '数据分析', icon: BarChart2 },
    { key: 'settings', label: '群设置', icon: Settings },
  ];

  const resetForm = () => {
    setFormName(group.name);
    setFormType(group.type);
    setFormLifecycle(group.lifecycle);
    setFormExpireAt(group.expireAt);
    setFormOwner(group.owner);
    setFormDescription(group.description);
  };

  const handleSave = () => {
    updateGroup(group.id, {
      name: formName,
      type: formType,
      lifecycle: formLifecycle,
      expireAt: formExpireAt,
      owner: formOwner,
      description: formDescription,
    });
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Link to="/groups" className="flex items-center gap-1 hover:text-accent-600 transition-colors">
          <ArrowLeft size={14} />返回社群列表
        </Link>
      </div>

      <div className="data-card p-6">
        <div className="flex items-start gap-5">
          <Avatar name={group.name} size="lg" className="!w-16 !h-16 !text-xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-ink-900">{group.name}</h1>
              <span className={cn('badge', GROUP_TYPE_COLORS[group.type].bg, GROUP_TYPE_COLORS[group.type].text)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', GROUP_TYPE_COLORS[group.type].dot)} />
                {GROUP_TYPE_LABELS[group.type]}
              </span>
              <span className={cn('badge', LIFECYCLE_COLORS[group.lifecycle])}>{LIFECYCLE_LABELS[group.lifecycle]}</span>
              {group.tags.map((t) => (
                <span key={t} className="chip bg-brand-50 text-brand-600 border border-brand-100">#{t}</span>
              ))}
            </div>
            <p className="text-sm text-ink-500 mt-2">{group.description}</p>
            <div className="flex items-center gap-5 mt-4 text-xs text-ink-500">
              <span>创建：{formatDate(group.createdAt)}</span>
              <span>到期：{formatDate(group.expireAt)}</span>
              <span>负责人：{group.owner}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm"><UserPlus size={13} />邀请成员</button>
            <button className="btn-secondary btn-sm"><Send size={13} />发送消息</button>
            <button className="btn-secondary btn-sm"><Archive size={13} />归档</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-ink-100">
          {[
            { label: '成员总数', value: group.memberCount, suffix: '人', color: 'text-brand-600', bg: 'bg-brand-50', icon: Users },
            { label: '7日活跃', value: group.activeMembers7d, suffix: '人', color: 'text-accent-600', bg: 'bg-accent-50', icon: TrendingUp },
            { label: '今日消息', value: group.messageCountToday, suffix: '条', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: MessageSquare },
            { label: '活跃率', value: formatPercent(activeRate, 1), suffix: '', color: activeRate > 0.5 ? 'text-success-600' : 'text-warning-600', bg: activeRate > 0.5 ? 'bg-success-50' : 'bg-warning-50', icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: stat.bg.replace('bg-', '').startsWith('brand') ? '#F0F7FF' : stat.bg.replace('bg-', '').startsWith('accent') ? '#EFFBF6' : stat.bg.replace('bg-', '').startsWith('cyan') ? '#ECFEFF' : stat.bg.replace('bg-', '').startsWith('success') ? '#ECFDF5' : '#FFF7EC' }}>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon size={16} />
              </div>
              <div>
                <div className="text-[10px] text-ink-500 uppercase tracking-wider font-medium">{stat.label}</div>
                <div className={cn('font-display font-bold text-lg', stat.color)}>
                  {stat.value}<span className="text-xs font-normal text-ink-400 ml-0.5">{stat.suffix}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-ink-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all relative',
              tab === t.key ? 'text-accent-600' : 'text-ink-500 hover:text-ink-700'
            )}
          >
            <t.icon size={15} />
            {t.label}
            {tab === t.key && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-500 rounded-full" />}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <div className="data-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-ink-100">
            <div className="text-sm text-ink-600">
              共 <span className="font-semibold text-ink-900">{groupMembers.length}</span> 名成员
            </div>
            <button className="btn-secondary btn-sm">导出名单</button>
          </div>
          <table className="w-full">
            <thead className="bg-ink-50/70">
              <tr>
                <th className="table-header">成员</th>
                <th className="table-header">状态</th>
                <th className="table-header text-right">发言数</th>
                <th className="table-header text-right">消费金额</th>
                <th className="table-header text-right">互动分</th>
                <th className="table-header text-right">价值分</th>
                <th className="table-header">入群时间</th>
                <th className="table-header">最后活跃</th>
              </tr>
            </thead>
            <tbody>
              {groupMembers.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.nickname} size="sm" />
                      <div>
                        <div className="font-medium text-ink-900">{m.nickname}</div>
                        {m.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {m.tags.slice(0, 2).map((t, i) => (
                              <span key={i} className="chip bg-ink-50 text-ink-500 border border-ink-100">标签{i + 1}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', MEMBER_STATUS_COLORS[m.status])}>{MEMBER_STATUS_LABELS[m.status]}</span>
                  </td>
                  <td className="table-cell text-right font-mono">{m.messageCount}</td>
                  <td className="table-cell text-right font-display font-semibold text-accent-600">¥{m.consumptionTotal.toLocaleString()}</td>
                  <td className="table-cell text-right">{m.interactionScore}</td>
                  <td className="table-cell text-right">
                    <span className="font-display font-bold text-brand-600">{m.valueScore}</span>
                  </td>
                  <td className="table-cell text-xs text-ink-500">{formatDate(m.joinAt)}</td>
                  <td className="table-cell text-xs text-ink-500">{formatRelative(m.lastActiveAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'messages' && (
        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">消息记录</h3>
              <p className="section-subtitle">最近7天群内消息互动</p>
            </div>
          </div>
          <div className="h-48 mb-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageTrend}>
                <defs>
                  <linearGradient id="mTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2A6FF5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2A6FF5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip />
                <Area type="monotone" dataKey="messages" name="消息量" stroke="#2A6FF5" strokeWidth={2} fill="url(#mTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {groupMembers.slice(0, 8).map((m, i) => (
              <div key={m.id} className="flex gap-2.5 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <Avatar name={m.nickname} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-ink-800">{m.nickname}</span>
                    <span className="text-[10px] text-ink-400">{formatRelative(m.lastActiveAt)}</span>
                  </div>
                  <div className="mt-1 p-2.5 bg-ink-50 rounded-lg rounded-tl-sm text-sm text-ink-700 inline-block max-w-xl">
                    {truncateText([
                      '大家好，我是新来的请多关照！',
                      '这个产品效果确实不错，已经推荐给朋友了',
                      '请问下次活动是什么时候呀～',
                      '客服在吗？想咨询下订单问题',
                      '打卡签到！今天也要加油',
                    ][i % 5], 80)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="data-card p-5">
            <h3 className="section-title mb-4">活跃率走势（近30天）</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={Array.from({ length: 30 }, (_, i) => ({
                  day: i + 1,
                  value: 45 + Math.sin(i / 3) * 15 + Math.random() * 10,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, '活跃率']} />
                  <Line type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="data-card p-5">
            <h3 className="section-title mb-4">成员价值分布</h3>
            <div className="space-y-3 pt-2">
              {[
                { label: '高价值 (≥80分)', count: Math.floor(group.memberCount * 0.1), pct: 10, color: 'bg-accent-500' },
                { label: '中价值 (50-79分)', count: Math.floor(group.memberCount * 0.4), pct: 40, color: 'bg-brand-500' },
                { label: '低价值 (30-49分)', count: Math.floor(group.memberCount * 0.35), pct: 35, color: 'bg-warning-500' },
                { label: '待激活 (<30分)', count: Math.floor(group.memberCount * 0.15), pct: 15, color: 'bg-ink-400' },
              ].map((seg) => (
                <div key={seg.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink-700 font-medium">{seg.label}</span>
                    <span className="text-ink-500">{seg.count}人 / {seg.pct}%</span>
                  </div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', seg.color)} style={{ width: `${seg.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="data-card p-5 col-span-2">
            <h3 className="section-title mb-4">运营策略建议</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { title: '活跃率提升', desc: `当前活跃率${formatPercent(activeRate, 1)}，建议增加互动话题和福利活动`, tag: '增长建议', color: 'text-accent-600 bg-accent-50' },
                { title: '沉默用户激活', desc: `共${Math.floor(group.memberCount * 0.25)}名沉默用户，可定向发送专属优惠券`, tag: '用户运营', color: 'text-brand-600 bg-brand-50' },
                { title: '高价值维护', desc: `${Math.floor(group.memberCount * 0.1)}名高价值成员，建议邀请加入VIP群`, tag: '生命周期', color: 'text-warning-600 bg-warning-50' },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl border border-ink-100 hover:border-accent-200 transition-colors">
                  <div className={cn('chip mb-2', item.color)}>{item.tag}</div>
                  <h4 className="font-semibold text-sm text-ink-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-ink-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="data-card p-6 max-w-3xl relative">
          {toast && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-success-50 text-success-700 text-sm font-medium rounded-lg border border-success-200 shadow-sm animate-fade-in">
              保存成功
            </div>
          )}
          <h3 className="section-title mb-5">基础设置</h3>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1.5">社群名称</label>
                <input className="input-base" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1.5">社群类型</label>
                <select className="input-base" value={formType} onChange={(e) => setFormType(e.target.value as GroupType)}>
                  {(Object.keys(GROUP_TYPE_LABELS) as GroupType[]).map((key) => (
                    <option key={key} value={key}>{GROUP_TYPE_LABELS[key]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">社群描述</label>
              <textarea className="input-base min-h-[80px]" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1.5">生命周期阶段</label>
                <select className="input-base" value={formLifecycle} onChange={(e) => setFormLifecycle(e.target.value as LifecyclePhase)}>
                  {(Object.keys(LIFECYCLE_LABELS) as LifecyclePhase[]).map((key) => (
                    <option key={key} value={key}>{LIFECYCLE_LABELS[key]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1.5">到期时间</label>
                <input type="date" className="input-base" value={formExpireAt} onChange={(e) => setFormExpireAt(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">负责人</label>
              <select className="input-base" value={formOwner} onChange={(e) => setFormOwner(e.target.value)}>
                {OWNER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-3 border-t border-ink-100">
              <button className="btn-primary" onClick={handleSave}>保存设置</button>
              <button className="btn-secondary" onClick={resetForm}>取消</button>
              <button className="btn-danger ml-auto">删除社群</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
