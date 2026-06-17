
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildMockStore, type MockStore } from '@/mocks/data';
import type { Group, Member, MemberTag, MessageTemplate, Keyword, Alert, ScheduleTask, AlertStatus, ExpiringGroup } from '@/types';
import { GROUP_TYPE_LABELS, LIFECYCLE_LABELS } from '@/utils/constants';

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

interface AppState extends MockStore {
  selectedGroupId?: string;
  setSelectedGroup: (id?: string) => void;
  updateAlertStatus: (id: string, status: AlertStatus, note?: string) => void;
  addTag: (tag: Omit<MemberTag, 'id' | 'memberCount'>) => void;
  deleteTag: (id: string) => void;
  addKeyword: (kw: Omit<Keyword, 'id' | 'triggerCount'>) => void;
  deleteKeyword: (id: string) => void;
  addTemplate: (tpl: Omit<MessageTemplate, 'id' | 'usageCount' | 'createdAt'>) => void;
  updateTemplate: (id: string, data: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addTask: (task: Omit<ScheduleTask, 'id' | 'totalSent' | 'createdAt'>) => void;
  toggleKeyword: (id: string) => void;
  createGroup: (g: Omit<Group, 'id' | 'status' | 'createdAt'>) => void;
  archiveGroup: (id: string) => void;
  updateGroup: (id: string, data: Partial<Group>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      expiringGroups: recomputeExpiring(initial.groups),

      setSelectedGroup: (id) => set({ selectedGroupId: id }),

      updateAlertStatus: (id, status, note) =>
        set((s) => {
          const newAlerts = s.alerts.map((a) =>
            a.id === id ? { ...a, status, note: note ?? a.note, handledAt: new Date().toISOString(), handledBy: '当前用户' } : a
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
          templates: [{ ...tpl, id: `tmp_${Date.now()}`, usageCount: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...s.templates],
        })),

      updateTemplate: (id, data) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...data } : t)) })),

      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      addTask: (task) =>
        set((s) => ({
          tasks: [{ ...task, id: `task_${Date.now()}`, totalSent: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...s.tasks],
        })),

      createGroup: (g) =>
        set((s) => {
          const newGroups = [{ ...g, id: `g_${Date.now()}`, status: 'normal' as const, createdAt: new Date().toISOString().slice(0, 10) }, ...s.groups];
          return {
            groups: newGroups,
            expiringGroups: recomputeExpiring(newGroups),
            kpi: { ...s.kpi, totalGroups: newGroups.filter(g2 => g2.lifecycle !== 'archived').length },
          };
        }),

      archiveGroup: (id) =>
        set((s) => {
          const newGroups = s.groups.map((g) =>
            g.id === id ? { ...g, lifecycle: 'archived' as const, lifecycleLabel: '已归档', status: 'archived' as const } : g
          );
          return {
            groups: newGroups,
            expiringGroups: recomputeExpiring(newGroups),
            kpi: { ...s.kpi, totalGroups: newGroups.filter(g2 => g2.lifecycle !== 'archived').length },
          };
        }),

      updateGroup: (id, data) =>
        set((s) => {
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
          return {
            groups: newGroups,
            expiringGroups: recomputeExpiring(newGroups),
          };
        }),
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
      }),
    }
  )
);
