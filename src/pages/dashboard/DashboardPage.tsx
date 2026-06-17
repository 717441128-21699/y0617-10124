
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageCircle, Activity, UserMinus, AlertTriangle, Users2,
  Send, FileText, PlusCircle, ArrowRight, Clock, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { KpiCard } from '@/components/ui/KpiCard';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatNumber, formatPercent } from '@/utils/format';
import {
  ALERT_PRIORITY_COLORS, ALERT_PRIORITY_LABELS, ALERT_STATUS_LABELS,
  ALERT_STATUS_COLORS, GROUP_TYPE_COLORS, LIFECYCLE_COLORS,
} from '@/utils/constants';
import { formatRelative, formatTime } from '@/utils/date';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    kpi, messageTrend, activeTrend, memberGrowthTrend, alerts, groups,
    expiringGroups, highValueMembers, dailyMetrics,
  } = useAppStore();

  const pendingAlerts = alerts.filter((a) => a.status === 'pending').slice(0, 5);
  const groupTypeData = (['new_customer', 'paid_member', 'trial', 'vip'] as const).map((type) => ({
    name: type === 'new_customer' ? '新客群' : type === 'paid_member' ? '付费会员' : type === 'trial' ? '体验群' : 'VIP群',
    value: groups.filter((g) => g.type === type).length,
    color: GROUP_TYPE_COLORS[type].dot,
  }));

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight">运营仪表盘</h1>
          <p className="text-sm text-ink-500 mt-1">实时掌握私域运营全局数据，快速响应告警</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-base h-9 w-auto">
            <option>今日</option>
            <option>近7天</option>
            <option>近30天</option>
            <option>本季度</option>
          </select>
          <button className="btn-secondary btn-sm">导出报表</button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <KpiCard
          label="社群总数"
          value={formatNumber(kpi.totalGroups)}
          delta={kpi.delta.totalGroups}
          accentColor="brand"
          icon={<Users2 size={20} strokeWidth={1.8} />}
        />
        <KpiCard
          label="成员总数"
          value={formatNumber(kpi.totalMembers)}
          delta={kpi.delta.totalMembers}
          accentColor="accent"
          icon={<Users size={20} strokeWidth={1.8} />}
        />
        <KpiCard
          label="今日消息量"
          value={formatNumber(kpi.todayMessages)}
          delta={kpi.delta.todayMessages}
          accentColor="cyan"
          icon={<MessageCircle size={20} strokeWidth={1.8} />}
        />
        <KpiCard
          label="30日活跃率"
          value={formatPercent(kpi.activeRate)}
          delta={kpi.delta.activeRate}
          accentColor="accent"
          icon={<Activity size={20} strokeWidth={1.8} />}
        />
        <KpiCard
          label="成员流失率"
          value={formatPercent(kpi.churnRate)}
          delta={kpi.delta.churnRate}
          accentColor="danger"
          icon={<UserMinus size={20} strokeWidth={1.8} />}
        />
        <KpiCard
          label="待处理告警"
          value={pendingAlerts.length}
          deltaSuffix="件"
          accentColor="warning"
          icon={<AlertTriangle size={20} strokeWidth={1.8} />}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="data-card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">消息量趋势</h3>
              <p className="section-subtitle">近14天社群消息互动变化</p>
            </div>
            <div className="flex gap-1.5 text-[11px]">
              <span className="px-2 py-1 rounded-md bg-accent-50 text-accent-700 font-medium">消息量</span>
              <span className="px-2 py-1 rounded-md bg-brand-50 text-brand-700 font-medium">新增成员</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyMetrics}>
                <defs>
                  <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2A6FF5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2A6FF5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.12)' }}
                  labelStyle={{ fontWeight: 600, color: '#111827' }}
                  cursor={{ stroke: '#E5E7EB' }}
                />
                <Area type="monotone" dataKey="messageCount" name="消息量" stroke="#0D9488" strokeWidth={2} fill="url(#msgGrad)" />
                <Area type="monotone" dataKey="newMembers" name="新增成员" stroke="#2A6FF5" strokeWidth={2} fill="url(#newGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">社群构成</h3>
              <p className="section-subtitle">按类型分布</p>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={groupTypeData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {groupTypeData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {groupTypeData.map((g) => (
              <div key={g.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', g.color.replace('bg-', 'bg-'))} style={{ background: g.color }} />
                  <span className="text-ink-600">{g.name}</span>
                </div>
                <span className="font-display font-semibold text-ink-900">{g.value} 个</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="data-card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">活跃率走势</h3>
              <p className="section-subtitle">近14天社群成员30日活跃率变化</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.12)' }} formatter={(v) => [`${v}%`, '活跃率']} />
                <Line type="monotone" dataKey="value" name="活跃率" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: '#0D9488', strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">快速操作</h3>
              <p className="section-subtitle">常用功能一键直达</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Send, label: '发起群发', path: '/templates', color: 'bg-accent-50 text-accent-700' },
              { icon: FileText, label: '新建模板', path: '/templates', color: 'bg-brand-50 text-brand-700' },
              { icon: PlusCircle, label: '创建社群', path: '/groups', color: 'bg-purple-50 text-purple-700' },
              { icon: Zap, label: '关键词配置', path: '/alerts/settings', color: 'bg-warning-50 text-warning-700' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-start gap-2 p-3 rounded-xl border border-ink-100 hover:border-accent-200 hover:bg-accent-50/30 transition-all group"
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.color)}>
                  <item.icon size={16} />
                </div>
                <div className="text-xs font-medium text-ink-700 group-hover:text-accent-700 flex items-center gap-1">
                  {item.label}
                  <ArrowRight size={11} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </button>
            ))}
          </div>

          {expiringGroups.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-warning-50 border border-warning-200">
              <div className="flex items-center gap-1.5 text-warning-800 text-xs font-semibold mb-1.5">
                <Clock size={13} /> 到期提醒
              </div>
              <div className="text-warning-700 text-xs">
                共 <span className="font-bold">{expiringGroups.length}</span> 个社群即将到期，建议
                <button onClick={() => navigate('/lifecycle')} className="underline font-medium ml-1 hover:text-warning-900">立即处理 →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="data-card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">待处理告警</h3>
              <p className="section-subtitle">关键词触发的实时风控告警</p>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-accent-600 font-medium hover:text-accent-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          {pendingAlerts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-ink-400 text-sm">
              暂无待处理告警 🎉
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-xl border-l-4 bg-white hover:bg-ink-50 transition-colors cursor-pointer',
                    ALERT_PRIORITY_COLORS[alert.priority].border
                  )}
                  onClick={() => navigate('/alerts')}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={alert.memberName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-ink-900">{alert.memberName}</span>
                        <span className="chip bg-ink-100 text-ink-600">{alert.groupName}</span>
                        <span className={cn('badge', ALERT_PRIORITY_COLORS[alert.priority].badge)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse-dot', ALERT_PRIORITY_COLORS[alert.priority].dot)} />
                          {ALERT_PRIORITY_LABELS[alert.priority]}
                        </span>
                        <span className={cn('badge', ALERT_STATUS_COLORS[alert.status])}>
                          {ALERT_STATUS_LABELS[alert.status]}
                        </span>
                      </div>
                      <p className="text-xs text-ink-700 line-clamp-1">
                        匹配关键词「<span className="text-danger-600 font-medium">{alert.keyword}</span>」：{alert.messageContent}
                      </p>
                    </div>
                    <span className="text-[10px] text-ink-400 whitespace-nowrap">{formatRelative(alert.messageTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">高价值成员</h3>
              <p className="section-subtitle">综合消费+活跃+互动评分</p>
            </div>
          </div>
          <div className="space-y-3">
            {highValueMembers.slice(0, 6).map((m, i) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <div className="relative">
                  <Avatar name={m.nickname} size="sm" />
                  <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-gradient-to-br from-warning-400 to-warning-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-ink-900 truncate">{m.nickname}</span>
                  </div>
                  <div className="text-[10px] text-ink-400 truncate">{m.groupName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-display font-bold text-accent-700">{m.valueScore}</div>
                  <div className="text-[10px] text-ink-400">价值分</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="data-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Top 活跃社群</h3>
            <p className="section-subtitle">按近7日消息量和活跃成员排名</p>
          </div>
          <button onClick={() => navigate('/groups')} className="text-xs text-accent-600 font-medium hover:text-accent-700 flex items-center gap-1">
            全部社群 <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="table-header">社群名称</th>
                <th className="table-header">类型</th>
                <th className="table-header">生命周期</th>
                <th className="table-header text-right">成员数</th>
                <th className="table-header text-right">7日活跃</th>
                <th className="table-header text-right">今日消息</th>
                <th className="table-header text-right">活跃率</th>
                <th className="table-header">负责人</th>
              </tr>
            </thead>
            <tbody>
              {[...groups].sort((a, b) => b.messageCountToday - a.messageCountToday).slice(0, 6).map((g) => (
                <tr key={g.id} className="table-row cursor-pointer" onClick={() => navigate(`/groups/${g.id}`)}>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={g.name} size="sm" />
                      <div>
                        <div className="font-medium text-ink-900">{g.name}</div>
                        <div className="text-[11px] text-ink-400">创建于 {g.createdAt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', GROUP_TYPE_COLORS[g.type].bg, GROUP_TYPE_COLORS[g.type].text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', GROUP_TYPE_COLORS[g.type].dot)} />
                      {g.typeLabel}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', LIFECYCLE_COLORS[g.lifecycle])}>{g.lifecycleLabel}</span>
                  </td>
                  <td className="table-cell text-right font-display font-semibold">{g.memberCount}</td>
                  <td className="table-cell text-right">{g.activeMembers7d}</td>
                  <td className="table-cell text-right">{g.messageCountToday}</td>
                  <td className="table-cell text-right">
                    <span className={cn(
                      'font-display font-semibold',
                      (g.activeMembers7d / g.memberCount) > 0.5 ? 'text-accent-600' : (g.activeMembers7d / g.memberCount) > 0.3 ? 'text-brand-600' : 'text-warning-600'
                    )}>
                      {formatPercent(g.activeMembers7d / g.memberCount, 0)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={g.owner} size="xs" />
                      <span className="text-xs text-ink-600">{g.owner}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
