
import { create } from 'zustand';
import { buildMockStore, type MockStore } from '@/mocks/data';
import type { Group, Member, MemberTag, MessageTemplate, Keyword, Alert, ScheduleTask, AlertStatus } from '@/types';

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
}

export const useAppStore = create<AppState>((set) => {
  const initial = buildMockStore();
  return {
    ...initial,
    setSelectedGroup: (id) => set({ selectedGroupId: id }),
    updateAlertStatus: (id, status, note) =>
      set((s) => ({
        alerts: s.alerts.map((a) =>
          a.id === id ? { ...a, status, note: note ?? a.note, handledAt: new Date().toISOString(), handledBy: '当前用户' } : a
        ),
      })),
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
      set((s) => ({
        groups: [{ ...g, id: `g_${Date.now()}`, status: 'normal', createdAt: new Date().toISOString().slice(0, 10) }, ...s.groups],
      })),
    archiveGroup: (id) =>
      set((s) => ({
        groups: s.groups.map((g) =>
          g.id === id ? { ...g, lifecycle: 'archived', lifecycleLabel: '已归档', status: 'archived' } : g
        ),
      })),
  };
});
