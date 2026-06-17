
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronRight, HelpCircle, MessageSquare, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const CRUMB_MAP: Record<string, { label: string; parent?: { path: string; label: string } }> = {
  '/dashboard': { label: '运营仪表盘' },
  '/groups': { label: '社群列表', parent: { path: '/groups', label: '社群管理' } },
  '/templates': { label: '模板库', parent: { path: '/templates', label: '消息中心' } },
  '/templates/schedule': { label: '定时任务', parent: { path: '/templates', label: '消息中心' } },
  '/members': { label: '成员列表', parent: { path: '/members', label: '成员管理' } },
  '/members/tags': { label: '标签库', parent: { path: '/members', label: '成员管理' } },
  '/members/segments': { label: '人群包', parent: { path: '/members', label: '成员管理' } },
  '/alerts': { label: '告警中心', parent: { path: '/alerts', label: '风控监控' } },
  '/alerts/settings': { label: '关键词配置', parent: { path: '/alerts', label: '风控监控' } },
  '/analytics': { label: '数据概览', parent: { path: '/analytics', label: '数据分析' } },
  '/analytics/compare': { label: '策略对比', parent: { path: '/analytics', label: '数据分析' } },
  '/lifecycle': { label: '生命周期管理' },
};

export function Topbar() {
  const location = useLocation();
  const pendingAlerts = useAppStore((s) => s.alerts.filter((a) => a.status === 'pending').length);
  const pathKey = Object.keys(CRUMB_MAP).find((k) => location.pathname === k || location.pathname.startsWith(k + '/')) || location.pathname;
  const crumb = CRUMB_MAP[pathKey];

  return (
    <header className="h-16 bg-white border-b border-ink-100 flex items-center px-6 gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-1 text-sm text-ink-600">
        <Link to="/dashboard" className="text-ink-400 hover:text-accent-600 transition-colors">首页</Link>
        {crumb?.parent && (
          <>
            <ChevronRight size={14} className="text-ink-300" />
            <span className="text-ink-400">{crumb.parent.label}</span>
          </>
        )}
        <ChevronRight size={14} className="text-ink-300" />
        <span className="text-ink-900 font-medium">{crumb?.label || '页面'}</span>
      </div>

      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="搜索群名称 / 成员昵称 / 关键词..."
            className="input-base pl-9 h-9 bg-ink-50 border-transparent focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-secondary btn-sm flex items-center gap-1.5">
          <Plus size={13} />
          新建群
        </button>
        <button className="btn-ghost btn-sm">
          <HelpCircle size={15} />
        </button>
        <button className="relative btn-ghost btn-sm">
          <Bell size={15} />
          {pendingAlerts > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-danger-500 text-[9px] font-bold text-white flex items-center justify-center -translate-y-0.5 translate-x-0.5 animate-pulse-dot">
              {pendingAlerts > 9 ? '9+' : pendingAlerts}
            </span>
          )}
        </button>
        <button className="relative btn-ghost btn-sm">
          <MessageSquare size={15} />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent-500 -translate-y-0.5 translate-x-0.5" />
        </button>
      </div>
    </header>
  );
}
