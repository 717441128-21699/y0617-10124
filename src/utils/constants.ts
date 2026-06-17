
import type { AlertPriority, AlertStatus, GroupType, LifecyclePhase, TagCategory, TemplateCategory, KeywordGroupType, TaskStatus } from '@/types';

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  new_customer: '新客群',
  paid_member: '付费会员群',
  trial: '体验群',
  vip: 'VIP群',
};

export const GROUP_TYPE_COLORS: Record<GroupType, { bg: string; text: string; dot: string }> = {
  new_customer: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500' },
  paid_member: { bg: 'bg-accent-50', text: 'text-accent-700', dot: 'bg-accent-500' },
  trial: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500' },
  vip: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export const LIFECYCLE_LABELS: Record<LifecyclePhase, string> = {
  preparation: '筹备期',
  active: '活跃期',
  declining: '衰退期',
  archived: '已归档',
};

export const LIFECYCLE_COLORS: Record<LifecyclePhase, string> = {
  preparation: 'bg-ink-100 text-ink-700',
  active: 'bg-success-50 text-success-700',
  declining: 'bg-warning-50 text-warning-700',
  archived: 'bg-ink-100 text-ink-500',
};

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  attribute: '属性标签',
  behavior: '行为标签',
  consumption: '消费标签',
};

export const TAG_CATEGORY_COLORS: Record<TagCategory, string> = {
  attribute: 'bg-brand-50 text-brand-700 border-brand-200',
  behavior: 'bg-accent-50 text-accent-700 border-accent-200',
  consumption: 'bg-warning-50 text-warning-700 border-warning-200',
};

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  welcome: '欢迎语',
  weekly_report: '周报告',
  promotion: '促销活动',
  after_sale: '售后服务',
  notice: '通知公告',
  custom: '自定义',
};

export const KEYWORD_GROUP_LABELS: Record<KeywordGroupType, string> = {
  complaint: '投诉类',
  refund: '退款类',
  purchase: '购买咨询',
  competitor: '竞品词',
  sensitive: '敏感词',
  custom: '自定义',
};

export const KEYWORD_GROUP_COLORS: Record<KeywordGroupType, { bg: string; text: string }> = {
  complaint: { bg: 'bg-danger-50', text: 'text-danger-700' },
  refund: { bg: 'bg-orange-50', text: 'text-orange-700' },
  purchase: { bg: 'bg-accent-50', text: 'text-accent-700' },
  competitor: { bg: 'bg-purple-50', text: 'text-purple-700' },
  sensitive: { bg: 'bg-red-50', text: 'text-red-700' },
  custom: { bg: 'bg-ink-50', text: 'text-ink-700' },
};

export const ALERT_PRIORITY_LABELS: Record<AlertPriority, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export const ALERT_PRIORITY_COLORS: Record<AlertPriority, { border: string; badge: string; dot: string }> = {
  critical: { border: 'border-danger-400', badge: 'bg-danger-100 text-danger-700', dot: 'bg-danger-500' },
  high: { border: 'border-orange-400', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium: { border: 'border-warning-400', badge: 'bg-warning-100 text-warning-700', dot: 'bg-warning-500' },
  low: { border: 'border-ink-300', badge: 'bg-ink-100 text-ink-700', dot: 'bg-ink-400' },
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  pending: 'bg-danger-50 text-danger-700',
  processing: 'bg-warning-50 text-warning-700',
  resolved: 'bg-success-50 text-success-700',
  ignored: 'bg-ink-50 text-ink-600',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待执行',
  running: '运行中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-warning-50 text-warning-700',
  running: 'bg-accent-50 text-accent-700',
  paused: 'bg-ink-50 text-ink-600',
  completed: 'bg-success-50 text-success-700',
  failed: 'bg-danger-50 text-danger-700',
};

export const MEMBER_STATUS_LABELS: Record<'active' | 'inactive' | 'left', string> = {
  active: '活跃',
  inactive: '沉默',
  left: '已退群',
};

export const MEMBER_STATUS_COLORS: Record<'active' | 'inactive' | 'left', string> = {
  active: 'bg-success-50 text-success-700',
  inactive: 'bg-warning-50 text-warning-700',
  left: 'bg-ink-100 text-ink-500',
};

export const NAV_ITEMS = [
  { path: '/dashboard', label: '运营仪表盘', icon: 'LayoutDashboard' },
  { path: '/groups', label: '社群管理', icon: 'Users2', children: [{ path: '/groups', label: '社群列表' }, { path: '/groups/:id', label: '群详情', hidden: true }] },
  { path: '/templates', label: '消息中心', icon: 'MessageSquare', children: [{ path: '/templates', label: '模板库' }, { path: '/templates/schedule', label: '定时任务' }] },
  { path: '/members', label: '成员管理', icon: 'UserRound', children: [{ path: '/members', label: '成员列表' }, { path: '/members/tags', label: '标签库' }, { path: '/members/segments', label: '人群包' }] },
  { path: '/alerts', label: '风控监控', icon: 'AlertTriangle', children: [{ path: '/alerts', label: '告警中心' }, { path: '/alerts/settings', label: '关键词配置' }] },
  { path: '/analytics', label: '数据分析', icon: 'BarChart3', children: [{ path: '/analytics', label: '数据概览' }, { path: '/analytics/compare', label: '策略对比' }] },
  { path: '/lifecycle', label: '生命周期', icon: 'RefreshCcw' },
] as const;

export const CHART_COLORS = ['#0D9488', '#2A6FF5', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#10B981'];
