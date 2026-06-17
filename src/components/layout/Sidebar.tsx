
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users2, MessageSquare, UserRound, AlertTriangle,
  BarChart3, RefreshCcw, ChevronDown, LogOut, Settings, Bell,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS } from '@/utils/constants';
import { cn } from '@/utils/format';
import { useState } from 'react';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Users2, MessageSquare, UserRound, AlertTriangle, BarChart3, RefreshCcw,
};

function NavGroup({ item, currentPath }: { item: typeof NAV_ITEMS[number]; currentPath: string }) {
  const Icon = ICONS[item.icon];
  const hasChildren = 'children' in item && item.children && item.children.filter((c) => !(c as { hidden?: boolean }).hidden).length > 0;
  const actualChildren = hasChildren ? (item as unknown as { children: { path: string; label: string; hidden?: boolean }[] }).children.filter((c) => !c.hidden) : [];
  const isActive = currentPath === item.path || (hasChildren && actualChildren.some((c) => currentPath.startsWith(c.path)));
  const [open, setOpen] = useState(isActive);
  return (
    <div>
      <button
        onClick={() => (hasChildren ? setOpen(!open) : undefined)}
        className={cn('w-full', isActive && !hasChildren ? 'nav-item-active' : 'nav-item')}
      >
        {Icon && <Icon size={18} strokeWidth={1.8} />}
        <span className="flex-1 text-left">{item.label}</span>
        {hasChildren && (
          <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
        )}
      </button>
      {hasChildren && open && (
        <div className="mt-1 ml-8 space-y-0.5">
          {actualChildren.map((c) => (
            <Link
              key={c.path}
              to={c.path}
              className={cn(
                'block px-3 py-1.5 rounded-md text-xs transition-colors',
                currentPath === c.path || currentPath.startsWith(c.path + '/')
                  ? 'text-white bg-accent-600/15 font-medium'
                  : 'text-ink-400 hover:text-white hover:bg-white/5'
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <aside className="bg-brand-950 text-white flex flex-col">
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
          <Users2 size={18} />
        </div>
        <div>
          <div className="font-display font-bold text-[15px] tracking-tight">社群云管</div>
          <div className="text-[10px] text-ink-400 -mt-0.5">Community Ops Platform</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavGroup key={item.path} item={item as any} currentPath={location.pathname} />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <button className="nav-item w-full">
          <Settings size={18} strokeWidth={1.8} />
          <span>系统设置</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="nav-item w-full text-danger-400 hover:text-danger-300">
          <LogOut size={18} strokeWidth={1.8} />
          <span>退出登录</span>
        </button>
        <div className="mt-3 flex items-center gap-2.5 p-2 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-xs font-semibold">李</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">李娜（运营主管）</div>
            <div className="text-[10px] text-ink-400">super_admin</div>
          </div>
          <Bell size={14} className="text-ink-400" />
        </div>
      </div>
    </aside>
  );
}
