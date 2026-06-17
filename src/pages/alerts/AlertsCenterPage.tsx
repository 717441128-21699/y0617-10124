
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Filter, Settings, ChevronDown, Send, MessageCircle, User,
  CheckCircle, CheckCircle2, Clock, AlertCircle, XCircle, ChevronRight, Save, X, Bell,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/format';
import {
  ALERT_PRIORITY_COLORS, ALERT_PRIORITY_LABELS, ALERT_STATUS_COLORS, ALERT_STATUS_LABELS,
  KEYWORD_GROUP_COLORS, KEYWORD_GROUP_LABELS,
} from '@/utils/constants';
import { formatDateTime, formatRelative, formatTime } from '@/utils/date';
import type { Alert, AlertPriority, AlertStatus, KeywordGroupType } from '@/types';

const STATUS_FILTERS: Array<{ value: AlertStatus | 'all'; label: string; icon: any }> = [
  { value: 'all', label: '全部', icon: Bell },
  { value: 'pending', label: '待处理', icon: AlertCircle },
  { value: 'processing', label: '处理中', icon: Clock },
  { value: 'resolved', label: '已解决', icon: CheckCircle },
  { value: 'ignored', label: '已忽略', icon: XCircle },
];

export function AlertsCenterPage() {
  const navigate = useNavigate();
  const { alerts, keywords, updateAlertStatus, batchUpdateAlerts } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<KeywordGroupType | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(alerts.find((a) => a.status === 'pending')?.id || null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const filtered = alerts.filter((a) => {
    if (search && !a.memberName.includes(search) && !a.keyword.includes(search) && !a.messageContent.includes(search)) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
    if (groupFilter !== 'all') {
      const kw = keywords.find((k) => k.id === a.keywordId);
      if (!kw || kw.groupType !== groupFilter) return false;
    }
    return true;
  });

  const selectedAlert = alerts.find((a) => a.id === selected);

  const handleUpdateStatus = (newStatus: AlertStatus) => {
    if (!selectedAlert) return;
    updateAlertStatus(selectedAlert.id, newStatus, note || selectedAlert.note);
    setShowStatusPicker(false);
    setNote('');
  };

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const criticalCount = alerts.filter((a) => a.status === 'pending' && a.priority === 'critical').length;

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight flex items-center gap-2.5">
            告警中心
            {pendingCount > 0 && (
              <span className="badge bg-danger-100 text-danger-700 animate-pulse-dot">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
                {pendingCount} 条待处理
              </span>
            )}
            {criticalCount > 0 && (
              <span className="badge bg-danger-600 text-white animate-pulse-dot">
                {criticalCount} 紧急
              </span>
            )}
          </h1>
          <p className="text-sm text-ink-500 mt-1">关键词触发的实时风控告警，及时介入维护社群氛围</p>
        </div>
        <button onClick={() => navigate('/alerts/settings')} className="btn-secondary btn-sm">
          <Settings size={14} />关键词配置
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === 'all' ? alerts.length : alerts.filter((a) => a.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'data-card p-4 text-left transition-all relative overflow-hidden',
                statusFilter === f.value && 'ring-2 ring-accent-500 shadow-card-hover'
              )}
              style={statusFilter === f.value ? { borderColor: '#0D9488' } : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <f.icon size={16} className={cn(
                  f.value === 'pending' ? 'text-danger-500' :
                  f.value === 'processing' ? 'text-warning-500' :
                  f.value === 'resolved' ? 'text-success-500' :
                  f.value === 'ignored' ? 'text-ink-400' : 'text-accent-500'
                )} />
                <span className="font-display font-bold text-xl text-ink-900">{count}</span>
              </div>
              <div className="text-xs font-medium text-ink-600">{f.label}</div>
            </button>
          );
        })}
      </div>

      <div className="data-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索成员、关键词、消息..." className="input-base pl-9 h-9" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500 flex items-center gap-1">
              <Filter size={12} />优先级：
            </span>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  'px-2.5 h-7 rounded-lg text-xs font-medium transition-all',
                  priorityFilter === p ? 'bg-accent-600 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                )}
              >{p === 'all' ? '全部' : ALERT_PRIORITY_LABELS[p]}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500 flex items-center gap-1">
              <Filter size={12} />关键词类型：
            </span>
            {(['all', 'complaint', 'refund', 'purchase', 'competitor', 'sensitive', 'custom'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={cn(
                  'px-2.5 h-7 rounded-lg text-xs font-medium transition-all',
                  groupFilter === g
                    ? g === 'all'
                      ? 'bg-accent-600 text-white'
                      : cn(KEYWORD_GROUP_COLORS[g].bg, KEYWORD_GROUP_COLORS[g].text)
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                )}
              >{g === 'all' ? '全部' : KEYWORD_GROUP_LABELS[g]}</button>
            ))}
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  batchUpdateAlerts(selectedIds, 'resolved');
                  setSelectedIds([]);
                }}
                className="btn-primary btn-sm"
              >
                <CheckCircle2 size={13} />批量已解决
              </button>
              <button
                onClick={() => {
                  batchUpdateAlerts(selectedIds, 'ignored');
                  setSelectedIds([]);
                }}
                className="btn-secondary btn-sm"
              >
                <XCircle size={13} />批量已忽略
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 data-card overflow-hidden max-h-[calc(100vh-320px)] flex flex-col">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(filtered.map((a) => a.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                className="w-3.5 h-3.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <div className="text-sm font-medium text-ink-900">告警列表 ({filtered.length})</div>
              {selectedIds.length > 0 && (
                <span className="text-xs text-brand-600 font-medium">已选 {selectedIds.length}/{filtered.length}</span>
              )}
            </div>
            <span className="text-[10px] text-ink-400">最新在前</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.map((alert) => (
              <button
                key={alert.id}
                onClick={() => setSelected(alert.id)}
                className={cn(
                  'w-full text-left p-3.5 border-b border-ink-50 transition-all relative',
                  selected === alert.id ? 'bg-accent-50/40 border-l-4 border-l-accent-500' : 'hover:bg-ink-50',
                  selectedIds.includes(alert.id) && 'bg-brand-50/40 border-l-4 border-l-brand-500',
                  alert.status === 'pending' && selected !== alert.id && !selectedIds.includes(alert.id) && 'bg-danger-50/20'
                )}
              >
                {alert.status === 'pending' && !selectedIds.includes(alert.id) && (
                  <span className={cn('absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse-dot', ALERT_PRIORITY_COLORS[alert.priority].dot)} />
                )}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(alert.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (selectedIds.includes(alert.id)) {
                        setSelectedIds(selectedIds.filter((id) => id !== alert.id));
                      } else {
                        setSelectedIds([...selectedIds, alert.id]);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 mt-1 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer flex-shrink-0"
                  />
                  <Avatar name={alert.memberName} size="sm" />
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-medium text-ink-900 truncate">{alert.memberName}</span>
                      <span className={cn('badge !py-0 text-[10px]', ALERT_PRIORITY_COLORS[alert.priority].badge)}>
                        {ALERT_PRIORITY_LABELS[alert.priority]}
                      </span>
                      <span className={cn('badge !py-0 text-[10px]', ALERT_STATUS_COLORS[alert.status])}>
                        {ALERT_STATUS_LABELS[alert.status]}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-700 line-clamp-2 leading-relaxed">
                      匹配「<span className="text-danger-600 font-medium">{alert.keyword}</span>」：{alert.messageContent}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-ink-400 truncate">{alert.groupName}</span>
                      <span className="text-[10px] text-ink-300">·</span>
                      <span className="text-[10px] text-ink-400">{formatRelative(alert.messageTime)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-ink-400 text-sm">暂无匹配告警</div>
            )}
          </div>
        </div>

        <div className="col-span-3 data-card overflow-hidden flex flex-col max-h-[calc(100vh-320px)]">
          {selectedAlert ? (
            <>
              <div className={cn('px-5 py-4 border-b border-ink-100 flex items-center justify-between')}>
                <div className="flex items-center gap-2.5">
                  <span className={cn('w-2 h-2 rounded-full', ALERT_PRIORITY_COLORS[selectedAlert.priority].dot)} />
                  <h3 className="font-display font-semibold text-ink-900">告警详情</h3>
                  <span className={cn('badge', ALERT_PRIORITY_COLORS[selectedAlert.priority].badge)}>{ALERT_PRIORITY_LABELS[selectedAlert.priority]}</span>
                  <span className={cn('badge', ALERT_STATUS_COLORS[selectedAlert.status])}>{ALERT_STATUS_LABELS[selectedAlert.status]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button onClick={() => setShowStatusPicker(!showStatusPicker)} className="btn-secondary btn-sm flex items-center gap-1">
                      更新状态 <ChevronDown size={12} />
                    </button>
                    {showStatusPicker && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-pop border border-ink-100 py-1 w-32 z-10 animate-fade-in">
                        {(['pending', 'processing', 'resolved', 'ignored'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleUpdateStatus(s)}
                            className={cn(
                              'w-full px-3 py-1.5 text-left text-xs hover:bg-ink-50 flex items-center gap-2',
                              selectedAlert.status === s && 'text-accent-600 font-medium'
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', ALERT_PRIORITY_COLORS[selectedAlert.priority].dot)} />
                            {ALERT_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
                <div className="p-4 rounded-xl bg-ink-50/60 border border-ink-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoRow icon={User} label="触发成员">
                      <div className="flex items-center gap-2">
                        <Avatar name={selectedAlert.memberName} size="xs" />
                        <span className="font-medium text-ink-900">{selectedAlert.memberName}</span>
                      </div>
                    </InfoRow>
                    <InfoRow icon={MessageCircle} label="所在社群">
                      <Link to={`/groups/${selectedAlert.groupId}`} className="font-medium text-brand-600 hover:underline">
                        {selectedAlert.groupName}
                      </Link>
                    </InfoRow>
                    <InfoRow icon={AlertCircle} label="匹配关键词">
                      <span className="font-medium text-danger-600">「{selectedAlert.keyword}」</span>
                    </InfoRow>
                    <InfoRow icon={Clock} label="触发时间">
                      <span className="font-medium text-ink-700">{formatDateTime(selectedAlert.messageTime)}</span>
                    </InfoRow>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-ink-700 mb-2.5 flex items-center gap-1.5">
                    <MessageCircle size={13} />消息上下文
                  </h4>
                  <div className="space-y-2.5 p-4 rounded-xl bg-gradient-to-b from-brand-50/20 to-transparent border border-ink-100">
                    {selectedAlert.contextMessages.map((msg) => (
                      <div key={msg.id} className={cn(
                        'flex gap-2 max-w-[85%]',
                        msg.isSelf ? 'ml-auto flex-row-reverse' : ''
                      )}>
                        <Avatar name={msg.sender} size="xs" />
                        <div>
                          <div className={cn(
                            'flex items-center gap-2 mb-1 text-[10px]',
                            msg.isSelf ? 'justify-end' : ''
                          )}>
                            <span className={cn('font-medium', msg.isSelf ? 'text-accent-600' : 'text-ink-600')}>{msg.sender}</span>
                            <span className="text-ink-400">{msg.time}</span>
                          </div>
                          <div className={cn(
                            'p-2.5 rounded-xl text-sm leading-relaxed inline-block',
                            msg.isSelf
                              ? 'bg-accent-500 text-white rounded-tr-sm'
                              : 'bg-white border border-ink-100 rounded-tl-sm text-ink-700 shadow-sm'
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-ink-700 mb-2">处理备注</h4>
                  <textarea
                    value={note || selectedAlert.note || ''}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-base min-h-[90px] resize-none"
                    placeholder="记录处理过程、解决方案等信息..."
                  />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleUpdateStatus('processing')} className="btn-secondary btn-sm">
                      <Clock size={13} />标记处理中
                    </button>
                    <button onClick={() => handleUpdateStatus('resolved')} className="btn-primary btn-sm">
                      <CheckCircle size={13} />标记已解决
                    </button>
                    <button className="btn-ghost btn-sm ml-auto">
                      <Send size={13} />私聊用户
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink-400 text-sm">
              请选择一条告警查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-ink-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-ink-400 uppercase tracking-wider font-medium mb-0.5">{label}</div>
        {children}
      </div>
    </div>
  );
}
