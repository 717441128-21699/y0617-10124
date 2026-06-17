
export type GroupType = 'new_customer' | 'paid_member' | 'trial' | 'vip';
export type LifecyclePhase = 'preparation' | 'active' | 'declining' | 'archived';
export type GroupStatus = 'normal' | 'warning' | 'expiring' | 'archived';

export interface Group {
  id: string;
  name: string;
  avatar: string;
  type: GroupType;
  typeLabel: string;
  lifecycle: LifecyclePhase;
  lifecycleLabel: string;
  memberCount: number;
  activeMembers7d: number;
  messageCountToday: number;
  createdAt: string;
  expireAt: string;
  status: GroupStatus;
  owner: string;
  description: string;
  tags: string[];
}

export type TagCategory = 'attribute' | 'behavior' | 'consumption';

export interface AutoTagRule {
  field: 'join_days' | 'consumption_total' | 'message_count' | 'last_active_days';
  operator: '>' | '<' | '>=' | '<=' | '==' | 'between';
  value: number | [number, number];
}

export interface MemberTag {
  id: string;
  name: string;
  color: string;
  category: TagCategory;
  categoryLabel: string;
  memberCount: number;
  autoRule?: AutoTagRule;
}

export interface Member {
  id: string;
  groupId: string;
  groupName: string;
  nickname: string;
  avatar: string;
  joinAt: string;
  lastActiveAt: string;
  messageCount: number;
  consumptionTotal: number;
  interactionScore: number;
  valueScore: number;
  tags: string[];
  status: 'active' | 'inactive' | 'left';
}

export type TemplateCategory = 'welcome' | 'weekly_report' | 'promotion' | 'after_sale' | 'notice' | 'custom';
export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface MessageTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  categoryLabel: string;
  content: string;
  variables: string[];
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
  createdBy: string;
}

export interface ScheduleTask {
  id: string;
  name: string;
  templateId: string;
  templateTitle: string;
  cronExpression: string;
  cronDescription: string;
  targetGroupIds: string[];
  targetGroupNames: string[];
  status: TaskStatus;
  nextRunAt: string;
  lastRunAt?: string;
  lastRunResult?: 'success' | 'failed';
  totalSent: number;
  createdAt: string;
}

export type KeywordGroupType = 'complaint' | 'refund' | 'purchase' | 'competitor' | 'sensitive' | 'custom';
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored';

export interface Keyword {
  id: string;
  word: string;
  groupType: KeywordGroupType;
  groupLabel: string;
  matchType: 'exact' | 'contains' | 'regex';
  priority: AlertPriority;
  enabled: boolean;
  triggerCount: number;
}

export interface ContextMessage {
  id: string;
  sender: string;
  isSelf: boolean;
  content: string;
  time: string;
}

export interface Alert {
  id: string;
  keywordId: string;
  keyword: string;
  priority: AlertPriority;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  groupId: string;
  groupName: string;
  messageId: string;
  messageContent: string;
  messageTime: string;
  contextMessages: ContextMessage[];
  status: AlertStatus;
  note?: string;
  handledBy?: string;
  handledAt?: string;
  createdAt: string;
}

export interface DailyPoint {
  date: string;
  value: number;
}

export interface DailyMetric {
  date: string;
  groupCount: number;
  memberCount: number;
  messageCount: number;
  activeMembers: number;
  newMembers: number;
  leftMembers: number;
}

export interface DashboardKpi {
  totalGroups: number;
  totalMembers: number;
  todayMessages: number;
  activeRate: number;
  churnRate: number;
  pendingAlerts: number;
  delta: {
    totalGroups: number;
    totalMembers: number;
    todayMessages: number;
    activeRate: number;
    churnRate: number;
    pendingAlerts: number;
  };
}

export interface ExpiringGroup {
  id: string;
  name: string;
  type: GroupType;
  typeLabel: string;
  lifecycle: LifecyclePhase;
  expireAt: string;
  daysLeft: number;
  memberCount: number;
  highValueCount: number;
  suggestedAction: 'archive' | 'migrate' | 'extend';
}

export interface HighValueMember {
  id: string;
  nickname: string;
  avatar: string;
  groupId: string;
  groupName: string;
  valueScore: number;
  consumptionTotal: number;
  interactionScore: number;
  lastActiveAt: string;
  tags: string[];
}

export interface StrategyCompareResult {
  groups: { id: string; name: string; color: string }[];
  metrics: { key: string; label: string; values: number[] }[];
  trends: { date: string; values: Record<string, number> }[];
  insights: string[];
}
