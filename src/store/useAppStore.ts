
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildMockStore, type MockStore } from '@/mocks/data';
import type { Group, Member, MemberTag, MessageTemplate, Keyword, Alert, ScheduleTask, AlertStatus, ExpiringGroup, TaskExecutionRecord, GroupLogType } from '@/types';
import { GROUP_TYPE_LABELS, LIFECYCLE_LABELS } from '@/utils/constants';

export interface GroupOperationLog {
  id: string;
  groupId: string;
  type: GroupLogType;
  title: string;
  detail: string;
  operator: string;
  createdAt: string;
}

const initial = buildMockStore();

function recomputeExpiring(groups: Group[]): ExpiringGroup[] {
  return groups
    .filter((g) => g.lifecycle !== 'archived')
    .map((g) => {
      const daysLeft = Math.floor((new Date(g.expireAt).getTime() - Date.now()) / 86400000);
      if (daysLeft > 14) return null;
      const hv = Math.floor(g.memberCount * 0.08);
      return {
        id: g.id, name: g.name, type: g.type, typeLabel: g.typeLabel, lifecycle: g.lifecycle,
        expireAt: g.expireAt, daysLeft, memberCount: g.memberCount, highValueCount: hv,
        suggestedAction: daysLeft <= 0 ? 'archive' as const : hv > 20 ? 'migrate' as const : 'extend' as const,
      };
    })
    .filter((x): x is ExpiringGroup => x !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

function computeNextRunByCron(task: ScheduleTask): string {
  const now = new Date();
  const cron = task.cronExpression.split(' ');
  const m = parseInt(cron[0], 10) || 0;
  const h = parseInt(cron[1], 10) || 9;
  const daysPart = cron[4];
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

  if (daysPart === '*') {
    if (candidate > now) return candidate.toISOString();
    candidate.setDate(candidate.getDate() + 1);
    return candidate.toISOString();
  }

  const days = daysPart.split(',').map((d) => parseInt(d, 10));
  const currentDay = now.getDay();
  const sortedDays = [...days].sort((a, b) => a - b);
  if (sortedDays.includes(currentDay) && candidate > now) return candidate.toISOString();
  for (const day of sortedDays) {
    if (day > currentDay) {
      candidate.setDate(candidate.getDate() + (day - currentDay));
      return candidate.toISOString();
    }
  }
  const nextDay = sortedDays[0];
  candidate.setDate(candidate.getDate() + (7 - currentDay + nextDay));
  return candidate.toISOString();
}

interface AppState extends MockStore {
  selectedGroupId?: string;
  groupLogs: GroupOperationLog[];
  taskExecutions: TaskExecutionRecord[];
  setSelectedGroup: (id?: string) => void;
  updateAlertStatus: (id: string, status: AlertStatus, note?: string) => void;
  batchUpdateAlerts: (ids: string[], status: AlertStatus) => void;
  addTag: (tag: Omit<MemberTag, 'id' | 'memberCount'>) => void;
  deleteTag: (id: string) => void;
  addKeyword: (kw: Omit<Keyword, 'id' | 'triggerCount'>) => void;
  deleteKeyword: (id: string) => void;
  addTemplate: (tpl: Omit<MessageTemplate, 'id' | 'usageCount' | 'createdAt'>) => void;
  updateTemplate: (id: string, data: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addTask: (task: Omit<ScheduleTask, 'id' | 'totalSent' | 'createdAt'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  runTaskNow: (id: string) => void;
  toggleKeyword: (id: string) => void;
  createGroup: (g: Omit<Group, 'id' | 'status' | 'createdAt'>) => void;
  archiveGroup: (id: string) => void;
  updateGroup: (id: string, data: Partial<Group>) => void;
  addGroupLog: (log: Omit<GroupOperationLog, 'id' | 'createdAt'>) => void;
}

const OPERATOR = '运营管理员';

function addLog(s: AppState, log: Omit<GroupOperationLog, 'id' | 'createdAt'>): AppState {
  return {
    ...s,
    groupLogs: [
      { ...log, id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() },
      ...s.groupLogs,
    ],
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      expiringGroups: recomputeExpiring(initial.groups),
      groupLogs: [],
      taskExecutions: [],

      setSelectedGroup: (id) => set({ selectedGroupId: id }),

      updateAlertStatus: (id, status, note) =>
        set((s) => {
          const newAlerts = s.alerts.map((a) =>
            a.id === id ? { ...a, status, note: note ?? a.note, handledAt: new Date().toISOString(), handledBy: OPERATOR } : a
          );
          const pendingCount = newAlerts.filter((a) => a.status === 'pending').length;
          return {
            alerts: newAlerts,
            kpi: { ...s.kpi, pendingAlerts: pendingCount },
          };
        }),

      batchUpdateAlerts: (ids, status) =>
        set((s) => {
          const newAlerts = s.alerts.map((a) =>
            ids.includes(a.id) ? { ...a, status, handledAt: new Date().toISOString(), handledBy: OPERATOR } : a
          );
          const pendingCount = newAlerts.filter((a) => a.status === 'pending').length;
          return {
            alerts: newAlerts,
            kpi: { ...s.kpi, pendingAlerts: pendingCount },
          };
        }),

      addTag: (tag) =>
        set((s) => ({
          tags: [{ ...tag, id: `t_${Date.now()}`, memberCount: 0 }, ...s.tags],
        })),

      deleteTag: (id) =>
        set((s) => ({ tags: s.tags.filter((t) => t.id !== id) })),

      addKeyword: (kw) =>
        set((s) => ({
          keywords: [{ ...kw, id: `kw_${Date.now()}`, triggerCount: 0 }, ...s.keywords],
        })),

      deleteKeyword: (id) =>
        set((s) => ({ keywords: s.keywords.filter((k) => k.id !== id) })),

      toggleKeyword: (id) =>
        set((s) => ({
          keywords: s.keywords.map((k) => (k.id === id ? { ...k, enabled: !k.enabled } : k)),
        })),

      addTemplate: (tpl) =>
        set((s) => ({
          templates: [{ ...tpl, id: `tmp_${Date.now()}`, usageCount: 0, createdAt: new Date().toISOString().slice(0, 10), lastUsedAt: new Date().toISOString().slice(0, 10) }, ...s.templates],
        })),

      updateTemplate: (id, data) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...data } : t)) })),

      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      addTask: (task) =>
        set((s) => {
          const newTasks = [{ ...task, id: `task_${Date.now()}`, totalSent: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...s.tasks];
          let next = s;
          task.targetGroupIds.forEach((gid) => {
            next = addLog(next, {
              groupId: gid,
              type: 'task_send',
              title: '创建定时推送任务',
              detail: `任务「${task.name}」已创建，模板：${task.templateTitle}，规则：${task.cronDescription}`,
              operator: OPERATOR,
            });
          });
          return { ...next, tasks: newTasks };
        }),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            if (t.status === 'running' || t.status === 'pending') return { ...t, status: 'paused' };
            if (t.status === 'paused') return { ...t, status: 'running', nextRunAt: computeNextRunByCron(t) };
            return t;
          }),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      runTaskNow: (id) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          const sentCount = Math.floor(Math.random() * 200 + 50);
          const now = new Date().toISOString();
          const execRecord: TaskExecutionRecord = {
            id: `exec_${Date.now()}`,
            taskId: task.id,
            taskName: task.name,
            templateId: task.templateId,
            templateTitle: task.templateTitle,
            targetGroupIds: task.targetGroupIds,
            targetGroupNames: task.targetGroupNames,
            result: 'success',
            sentCount,
            executedAt: now,
            triggeredBy: 'manual',
          };
          const updatedTasks = s.tasks.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              totalSent: t.totalSent + sentCount,
              lastRunAt: now,
              lastRunResult: 'success' as const,
              nextRunAt: computeNextRunByCron(t),
              status: t.status === 'completed' ? 'completed' as const : 'running' as const,
            };
          });
          let next = { ...s, tasks: updatedTasks, taskExecutions: [execRecord, ...s.taskExecutions] };
          task.targetGroupIds.forEach((gid) => {
            next = { ...next, groupLogs: addLog(next, {
              groupId: gid,
              type: 'task_send',
              title: '手动执行推送任务',
              detail: `任务「${task.name}」手动执行，发送${sentCount}条至${task.targetGroupNames.length}个群`,
              operator: OPERATOR,
            }).groupLogs };
          });
          return next;
        }),

      createGroup: (g) =>
        set((s) => {
          const newGroups = [{ ...g, id: `g_${Date.now()}`, status: 'normal' as const, createdAt: new Date().toISOString().slice(0, 10) }, ...s.groups];
          const next = addLog(s, {
            groupId: `g_${Date.now()}`,
            type: 'edit',
            title: '创建社群',
            detail: `社群「${g.name}」已创建，类型：${g.typeLabel}，负责人：${g.owner}`,
            operator: OPERATOR,
          });
          return {
            ...next,
            groups: newGroups,
            expiringGroups: recomputeExpiring(newGroups),
            kpi: { ...s.kpi, totalGroups: newGroups.filter(g2 => g2.lifecycle !== 'archived').length },
          };
        }),

      archiveGroup: (id) =>
        set((s) => {
          const g = s.groups.find((x) => x.id === id);
          const newGroups = s.groups.map((x) =>
            x.id === id ? { ...x, lifecycle: 'archived' as const, lifecycleLabel: '已归档', status: 'archived' as const } : x
          );
          const next = g ? addLog(s, {
            groupId: id,
            type: 'archive',
            title: '归档社群',
            detail: `社群「${g.name}」已归档，原负责人：${g.owner}`,
            operator: OPERATOR,
          }) : s;
          return {
            ...next,
            groups: newGroups,
            expiringGroups: recomputeExpiring(newGroups),
            kpi: { ...s.kpi, totalGroups: newGroups.filter(g2 => g2.lifecycle !== 'archived').length },
          };
        }),

      updateGroup: (id, data) =>
        set((s) => {
          const old = s.groups.find((g) => g.id === id);
          const newGroups = s.groups.map((g) => {
            if (g.id !== id) return g;
            const updated = { ...g, ...data };
            if (data.type) updated.typeLabel = GROUP_TYPE_LABELS[data.type];
            if (data.lifecycle) updated.lifecycleLabel = LIFECYCLE_LABELS[data.lifecycle];
            if (data.expireAt) {
              const daysLeft = Math.floor((new Date(data.expireAt).getTime() - Date.now()) / 86400000);
              updated.status = daysLeft <= 3 ? 'expiring' as const : daysLeft <= 14 ? 'warning' as const : 'normal' as const;
            }
            return updated;
          });

          let next = s;
          if (old && data.owner && data.owner !== old.owner) {
            next = addLog(next, {
              groupId: id,
              type: 'owner_change',
              title: '负责人变更',
              detail: `从「${old.owner}」变更为「${data.owner}」`,
              operator: OPERATOR,
            });
          }
          if (old && data.expireAt && data.expireAt !== old.expireAt) {
            next = addLog(next, {
              groupId: id,
              type: 'extend',
              title: '续期/延期',
              detail: `到期时间从「${old.expireAt}」调整为「${data.expireAt}」`,
              operator: OPERATOR,
            });
          }
          if (old && (data.name || data.type || data.lifecycle || data.description)) {
            next = addLog(next, {
              groupId: id,
              type: 'edit',
              title: '编辑社群信息',
              detail: `更新了社群基础信息${data.name ? `，名称：${data.name}` : ''}`,
              operator: OPERATOR,
            });
          }

          return {
            ...next,
            groups: newGroups,
            expiringGroups: recomputeExpiring(newGroups),
          };
        }),

      addGroupLog: (log) =>
        set((s) => addLog(s, log)),
    }),
    {
      name: 'community-mgmt-store',
      partialize: (state) => ({
        groups: state.groups,
        tags: state.tags,
        members: state.members,
        templates: state.templates,
        tasks: state.tasks,
        keywords: state.keywords,
        alerts: state.alerts,
        dailyMetrics: state.dailyMetrics,
        kpi: state.kpi,
        messageTrend: state.messageTrend,
        activeTrend: state.activeTrend,
        memberGrowthTrend: state.memberGrowthTrend,
        highValueMembers: state.highValueMembers,
        compareResult: state.compareResult,
        expiringGroups: state.expiringGroups,
        groupLogs: state.groupLogs,
        taskExecutions: state.taskExecutions,
      }),
    }
  )
);
