
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Pause, Calendar, Clock, Users2, Trash2, CheckCircle2, XCircle, Zap, RotateCcw, FileText } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber } from '@/utils/format';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/utils/constants';
import { formatDateTime, formatDate } from '@/utils/date';
import type { ScheduleTask, TaskStatus, TaskExecutionRecord } from '@/types';

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const DAY_OPTIONS = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 0 },
];

const FREQ_OPTIONS: { label: string; value: 'daily' | 'weekly' | 'monthly' | 'custom' }[] = [
  { label: '每天固定时间', value: 'daily' },
  { label: '每周特定时间', value: 'weekly' },
  { label: '每月固定日期', value: 'monthly' },
  { label: '自定义Cron', value: 'custom' },
];

function renderPreview(content: string, variableExamples: Record<string, string>) {
  const parts: Array<{ text: string; isVar: boolean; varName?: string }> = [];
  let lastIndex = 0;
  const regex = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: content.slice(lastIndex, match.index), isVar: false });
    }
    const varName = match[1];
    const example = variableExamples[varName];
    if (example && example.trim()) {
      parts.push({ text: example, isVar: false });
    } else {
      parts.push({ text: match[0], isVar: true, varName });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ text: content.slice(lastIndex), isVar: false });
  }
  return parts;
}

function buildCronExpression(frequency: string, scheduleTime: string, selectedDays: number[]): string {
  const [h, m] = scheduleTime.split(':').map(Number);
  if (frequency === 'daily') return `${m} ${h} * * *`;
  if (frequency === 'weekly' || frequency === 'custom') return `${m} ${h} * * ${[...selectedDays].sort((a, b) => a - b).join(',')}`;
  if (frequency === 'monthly') return `${m} ${h} 1 * *`;
  return `${m} ${h} * * *`;
}

function buildCronDescription(frequency: string, scheduleTime: string, selectedDays: number[]): string {
  const [h, m] = scheduleTime.split(':');
  const timeStr = `${h}:${m}`;
  if (frequency === 'daily') return `每天上午${timeStr}`;
  if (frequency === 'weekly' || frequency === 'custom') {
    const names = [...selectedDays].sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join('、');
    return `每周${names}上午${timeStr}`;
  }
  if (frequency === 'monthly') return `每月1日上午${timeStr}`;
  return `每天上午${timeStr}`;
}

function computeNextRunAt(frequency: string, scheduleTime: string, selectedDays: number[]): string {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const now = new Date();

  if (frequency === 'daily') {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (candidate > now) return candidate.toISOString();
    candidate.setDate(candidate.getDate() + 1);
    return candidate.toISOString();
  }

  if (frequency === 'weekly' || frequency === 'custom') {
    const currentDay = now.getDay();
    const sortedDays = [...selectedDays].sort((a, b) => a - b);
    if (sortedDays.includes(currentDay)) {
      const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      if (candidate > now) return candidate.toISOString();
    }
    for (const day of sortedDays) {
      if (day > currentDay) {
        const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (day - currentDay), hours, minutes);
        return candidate.toISOString();
      }
    }
    const nextDay = sortedDays[0];
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - currentDay + nextDay), hours, minutes);
    return candidate.toISOString();
  }

  if (frequency === 'monthly') {
    const candidate = new Date(now.getFullYear(), now.getMonth(), 1, hours, minutes);
    if (candidate > now) return candidate.toISOString();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1, hours, minutes).toISOString();
  }

  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes);
  return candidate.toISOString();
}

function TaskExecPanel({
  task,
  executions,
  onBack,
}: {
  task: ScheduleTask;
  executions: TaskExecutionRecord[];
  onBack: () => void;
}) {
  const { retryTaskExecution } = useAppStore();
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);
  const totalCount = executions.length;
  const successCount = executions.filter((e) => e.result === 'success').length;
  const failedCount = executions.filter((e) => e.result === 'failed').length;
  const totalSentCount = executions.reduce((s, e) => s + e.sentCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost btn-sm !p-1.5 text-ink-500 hover:text-ink-900">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-ink-900 truncate">{task.name}</h2>
            <span className={cn('badge', TASK_STATUS_COLORS[task.status])}>{TASK_STATUS_LABELS[task.status]}</span>
          </div>
          <p className="text-xs text-ink-400 mt-0.5">{task.cronDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="data-card p-3 text-center">
          <div className="text-[11px] text-ink-400">总执行次数</div>
          <div className="font-display font-bold text-xl text-ink-900 mt-1">{totalCount}</div>
        </div>
        <div className="data-card p-3 text-center">
          <div className="text-[11px] text-ink-400">成功次数</div>
          <div className="font-display font-bold text-xl text-success-600 mt-1">{successCount}</div>
        </div>
        <div className="data-card p-3 text-center">
          <div className="text-[11px] text-ink-400">失败次数</div>
          <div className="font-display font-bold text-xl text-danger-600 mt-1">{failedCount}</div>
        </div>
        <div className="data-card p-3 text-center">
          <div className="text-[11px] text-ink-400">总发送人数</div>
          <div className="font-display font-bold text-xl text-accent-600 mt-1">{formatNumber(totalSentCount)}</div>
        </div>
      </div>

      <div className="data-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink-50/70 border-b border-ink-100">
            <tr>
              <th className="table-header">执行时间</th>
              <th className="table-header">触发方式</th>
              <th className="table-header">目标群</th>
              <th className="table-header">发送人数</th>
              <th className="table-header">结果</th>
              <th className="table-header">使用模板</th>
            </tr>
          </thead>
          <tbody>
            {executions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-ink-400">暂无执行记录</td>
              </tr>
            ) : (
              executions.map((exec) => (
                <>
                  <tr
                    key={exec.id}
                    className="table-row cursor-pointer hover:bg-ink-50"
                    onClick={() => setSelectedExecId(selectedExecId === exec.id ? null : exec.id)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock size={11} className="text-ink-400" />
                        <span className="text-ink-700">{formatDateTime(exec.executedAt)}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          'badge text-[10px]',
                          exec.triggeredBy === 'schedule' ? 'bg-ink-100 text-ink-600' :
                          exec.triggeredBy === 'retry' ? 'bg-ink-100 text-ink-500' : 'bg-accent-50 text-accent-600'
                        )}>
                          {exec.triggeredBy === 'schedule' ? '定时' :
                           exec.triggeredBy === 'retry' ? '重试' : '手动'}
                        </span>
                        {exec.triggeredBy === 'retry' && exec.retrySourceId && (
                          <span className="badge bg-ink-50 text-ink-400 text-[9px]">
                            补发自执行记录 {exec.retrySourceId.slice(-8)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs text-ink-600">
                        <Users2 size={12} className="text-ink-400" />
                        <span>
                          {exec.targetGroupNames.slice(0, 3).join('、')}
                          {exec.targetGroupNames.length > 3 ? ` +${exec.targetGroupNames.length - 3}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-display font-semibold text-sm text-ink-900">{formatNumber(exec.sentCount)}</span>
                    </td>
                    <td className="table-cell">
                      {exec.result === 'success' ? (
                        <span className="badge bg-success-50 text-success-700">成功</span>
                      ) : exec.result === 'partial' ? (
                        <span className="badge bg-warning-50 text-warning-700">部分成功</span>
                      ) : (
                        <span className="badge bg-danger-50 text-danger-700">失败</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-brand-600 font-medium">{exec.templateTitle}</span>
                    </td>
                  </tr>
                  {selectedExecId === exec.id && (
                    <tr>
                      <td colSpan={6} className="bg-ink-50/50 border-t border-ink-100 p-4">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-sm font-semibold text-ink-900">各群发送详情</h4>
                            {exec.triggeredBy === 'retry' && exec.retrySourceId && (
                              <span className="badge bg-ink-100 text-ink-500 text-[10px]">
                                补发自执行记录 {exec.retrySourceId.slice(-8)}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {exec.perGroupResults.map((r) => (
                              <div key={r.groupId} className="flex items-center justify-between bg-white rounded-lg p-3 border border-ink-100">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-ink-900">{r.groupName}</div>
                                    <div className="text-xs text-ink-400 mt-0.5">发送人数：{formatNumber(r.sentCount)}</div>
                                    {r.result === 'failed' && r.failedReason && (
                                      <div className="text-xs text-danger-500 mt-0.5">{r.failedReason}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {r.result === 'success' ? (
                                    <span className="badge bg-success-50 text-success-700">成功</span>
                                  ) : (
                                    <span className="badge bg-danger-50 text-danger-700">失败</span>
                                  )}
                                  {r.result === 'failed' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        retryTaskExecution(exec.id, r.groupId);
                                      }}
                                      className="btn-ghost btn-sm !p-1.5 text-ink-500 hover:text-danger-600"
                                      title="重试"
                                    >
                                      <RotateCcw size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ScheduleTasksPage() {
  const navigate = useNavigate();
  const { tasks, groups, taskExecutions, toggleTask, deleteTask, runTaskNow } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filtered = tasks.filter((t) => statusFilter === 'all' || t.status === statusFilter);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;
  const selectedExecutions = selectedTaskId ? taskExecutions.filter((e) => e.taskId === selectedTaskId) : [];

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Link to="/templates" className="flex items-center gap-1 hover:text-accent-600 transition-colors"><ArrowLeft size={14} />返回模板库</Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight">定时推送任务</h1>
          <p className="text-sm text-ink-500 mt-1">共 <span className="font-semibold text-ink-900">{tasks.length}</span> 个任务，累计发送 {formatNumber(tasks.reduce((s, t) => s + t.totalSent, 0))} 条消息</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-ink-50 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                statusFilter === 'all' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              )}
            >全部</button>
            {(['running', 'pending', 'paused', 'completed', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  statusFilter === st ? cn('bg-white shadow-sm', TASK_STATUS_COLORS[st]) : 'text-ink-500 hover:text-ink-700'
                )}
              >{TASK_STATUS_LABELS[st]}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus size={14} />新建任务</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(['running', 'pending', 'paused', 'completed'] as const).map((st) => {
          const list = tasks.filter((t) => t.status === st);
          return (
            <div key={st} className="data-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={cn('badge', TASK_STATUS_COLORS[st])}>{TASK_STATUS_LABELS[st]}</span>
                <span className="font-display font-bold text-2xl text-ink-900">{list.length}</span>
              </div>
              <div className="text-[11px] text-ink-400">占比 {tasks.length === 0 ? '0%' : formatPercentSafe(list.length / tasks.length)}</div>
            </div>
          );
        })}
      </div>

      {selectedTask ? (
        <TaskExecPanel
          task={selectedTask}
          executions={selectedExecutions}
          onBack={() => setSelectedTaskId(null)}
        />
      ) : filtered.length === 0 ? (
        <div className="data-card p-12 text-center">
          <div className="text-ink-400 text-4xl mb-3">📭</div>
          <h3 className="text-lg font-display font-semibold text-ink-700 mb-2">暂无任务</h3>
          <p className="text-sm text-ink-400">点击右上角创建第一个定时推送任务</p>
        </div>
      ) : (
        <div className="data-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-50/70 border-b border-ink-100">
              <tr>
                <th className="table-header">任务名称</th>
                <th className="table-header">使用模板</th>
                <th className="table-header">推送规则</th>
                <th className="table-header">目标社群</th>
                <th className="table-header">状态</th>
                <th className="table-header">下次执行</th>
                <th className="table-header text-right">累计发送</th>
                <th className="table-header">上次结果</th>
                <th className="table-header text-right pr-5">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  groupsCount={groups.length}
                  toggleTask={toggleTask}
                  runTaskNow={runTaskNow}
                  deleteTask={deleteTask}
                  onRowClick={() => setSelectedTaskId(task.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CreateTaskModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function formatPercentSafe(v: number): string {
  if (!isFinite(v) || isNaN(v)) return '0%';
  return (v * 100).toFixed(0) + '%';
}

function TaskRow({
  task,
  groupsCount,
  toggleTask,
  runTaskNow,
  deleteTask,
  onRowClick,
}: {
  task: ScheduleTask;
  groupsCount: number;
  toggleTask: (id: string) => void;
  runTaskNow: (id: string) => void;
  deleteTask: (id: string) => void;
  onRowClick: () => void;
}) {
  const isPaused = task.status === 'paused';
  return (
    <tr className="table-row group cursor-pointer" onClick={onRowClick}>
      <td className="table-cell">
        <div className="font-medium text-ink-900">{task.name}</div>
        <div className="text-[11px] text-ink-400">创建于 {formatDate(task.createdAt)}</div>
      </td>
      <td className="table-cell">
        <span className="text-sm text-brand-600 font-medium hover:underline cursor-pointer">{task.templateTitle}</span>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-ink-400" />
          <div>
            <div className="text-xs font-medium text-ink-700">{task.cronDescription}</div>
            <div className="text-[10px] text-ink-400 font-mono">{task.cronExpression}</div>
          </div>
        </div>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1 text-xs text-ink-600">
          <Users2 size={12} className="text-ink-400" />
          <span>
            {task.targetGroupNames.length === groupsCount ? '全部群' : task.targetGroupNames.slice(0, 2).join('、')}
            {task.targetGroupNames.length > 2 && ` +${task.targetGroupNames.length - 2}`}
          </span>
        </div>
      </td>
      <td className="table-cell">
        <span className={cn('badge', TASK_STATUS_COLORS[task.status])}>{TASK_STATUS_LABELS[task.status]}</span>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1 text-xs">
          <Clock size={11} className="text-accent-500" />
          <span className="text-ink-600">{formatDateTime(task.nextRunAt)}</span>
        </div>
      </td>
      <td className="table-cell text-right font-display font-semibold text-accent-600">{task.totalSent}</td>
      <td className="table-cell">
        {task.lastRunResult && (
          <div className="flex items-center gap-1 text-xs">
            {task.lastRunResult === 'success' ? (
              <><CheckCircle2 size={13} className="text-success-500" /><span className="text-success-600">成功</span></>
            ) : (
              <><XCircle size={13} className="text-danger-500" /><span className="text-danger-600">失败</span></>
            )}
            <span className="text-ink-400 ml-1">{task.lastRunAt ? formatDate(task.lastRunAt) : ''}</span>
          </div>
        )}
      </td>
      <td className="table-cell text-right pr-5">
        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleTask(task.id)}
            className="btn-ghost btn-sm !p-1.5"
            title={isPaused ? '启动' : '暂停'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            onClick={() => runTaskNow(task.id)}
            className="btn-ghost btn-sm !p-1.5 text-accent-600"
            title="立即执行"
          >
            <Zap size={13} />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="btn-ghost btn-sm !p-1.5 text-danger-500"
            title="删除"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const { templates, groups, addTask } = useAppStore();
  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [taskName, setTaskName] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const totalSteps = selectedTemplate?.variables.length ? 4 : 3;
  const stepTitles = ['选择模板', '设置时间', '选择目标群', '填写变量'];

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setTaskName(tpl.title);
      setVariableValues({});
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const selectAllGroups = () => {
    setSelectedGroupIds(groups.map((g) => g.id));
  };

  const handleCreate = () => {
    if (!selectedTemplateId || !selectedTemplate) return;
    if ((frequency === 'weekly' || frequency === 'custom') && selectedDays.length === 0) return;
    if (selectedTemplate.variables.length > 0) {
      const allFilled = selectedTemplate.variables.every((v) => variableValues[v] && variableValues[v].trim());
      if (!allFilled) return;
    }
    const cronExpression = buildCronExpression(frequency, scheduleTime, selectedDays);
    const cronDescription = buildCronDescription(frequency, scheduleTime, selectedDays);
    const nextRunAt = computeNextRunAt(frequency, scheduleTime, selectedDays);
    const targetGroupNames = groups.filter((g) => selectedGroupIds.includes(g.id)).map((g) => g.name);

    addTask({
      name: taskName || selectedTemplate.title,
      templateId: selectedTemplateId,
      templateTitle: selectedTemplate.title,
      cronExpression,
      cronDescription,
      targetGroupIds: selectedGroupIds,
      targetGroupNames,
      status: 'pending',
      nextRunAt,
      variableValues,
    });
    onClose();
  };

  const canNext =
    step === 1
      ? !!selectedTemplateId
      : step === 2
      ? (frequency === 'weekly' || frequency === 'custom')
        ? selectedDays.length > 0
        : true
      : step === 3
      ? selectedGroupIds.length > 0
      : step === 4
      ? selectedTemplate?.variables.every((v) => variableValues[v] && variableValues[v].trim())
      : true;

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-xl overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900">新建定时任务</h3>
            <p className="text-[11px] text-ink-400 mt-0.5">步骤 {step}/{totalSteps} · {stepTitles[step - 1]}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm !p-1.5">✕</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3, 4].slice(0, totalSteps).map((i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                  i <= step ? 'bg-accent-500 text-white' : 'bg-ink-100 text-ink-400'
                )}>{i}</div>
                {i < totalSteps && <div className={cn('flex-1 h-0.5 mx-1.5 rounded', i < step ? 'bg-accent-500' : 'bg-ink-100')} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-2">选择消息模板</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      selectedTemplateId === tpl.id
                        ? 'border-accent-500 bg-accent-50/50'
                        : 'border-ink-100 hover:border-accent-200 hover:bg-accent-50/30'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      selectedTemplateId === tpl.id ? 'border-accent-500' : 'border-ink-300'
                    )}>
                      {selectedTemplateId === tpl.id && <div className="w-2 h-2 rounded-full bg-accent-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-ink-900">{tpl.title}</div>
                      <div className="text-[11px] text-ink-400 mt-0.5">
                        {tpl.categoryLabel}
                        {tpl.variables.length > 0 && ` · 包含变量 ${tpl.variables.map((v) => `{{${v}}}`).join(' ')}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-2">推送频率</label>
                <div className="grid grid-cols-2 gap-2">
                  {FREQ_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      onClick={() => setFrequency(opt.value)}
                      className={cn(
                        'p-3 rounded-xl border cursor-pointer transition-all',
                        frequency === opt.value
                          ? 'border-accent-500 bg-accent-50/50'
                          : 'border-ink-100 hover:border-accent-200 hover:bg-accent-50/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                          frequency === opt.value ? 'border-accent-500' : 'border-ink-300'
                        )}>
                          {frequency === opt.value && <div className="w-2 h-2 rounded-full bg-accent-500" />}
                        </div>
                        <div className="text-xs font-medium text-ink-900">{opt.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">具体时间</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="input-base"
                  />
                </div>
                {(frequency === 'weekly' || frequency === 'custom') && (
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1.5">执行星期</label>
                    <div className="flex gap-1">
                      {DAY_OPTIONS.map((d) => (
                        <span
                          key={d.value}
                          onClick={() => toggleDay(d.value)}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-colors',
                            selectedDays.includes(d.value)
                              ? 'bg-accent-500 text-white'
                              : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                          )}
                        >{d.label}</span>
                      ))}
                    </div>
                    {(frequency === 'weekly' || frequency === 'custom') && selectedDays.length === 0 && (
                      <div className="text-[11px] text-danger-500 mt-1.5">请至少选择一个执行日期</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-2">选择目标社群 ({groups.length}个可选)</label>
              <div className="border border-ink-200 rounded-xl p-2 mb-3">
                <div className="flex gap-2 pb-2 border-b border-ink-100 mb-2">
                  <button onClick={selectAllGroups} className="text-xs text-accent-600 font-medium px-2 py-1 rounded-md bg-accent-50">全选</button>
                  <button onClick={() => setSelectedGroupIds([])} className="text-xs text-ink-500 px-2 py-1 rounded-md hover:bg-ink-50">清空</button>
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      onClick={() => toggleGroup(g.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg cursor-pointer',
                        selectedGroupIds.includes(g.id) ? 'bg-accent-50/60' : 'hover:bg-ink-50'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center',
                        selectedGroupIds.includes(g.id) ? 'border-accent-500 bg-accent-500' : 'border-ink-300'
                      )}>
                        {selectedGroupIds.includes(g.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-ink-700 flex-1">{g.name}</span>
                      <span className="text-[10px] text-ink-400">{g.memberCount}人</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && selectedTemplate && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-2">填写变量值</label>
                <div className="bg-ink-50/50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTemplate.variables.map((v) => (
                      <div key={v}>
                        <label className="block text-xs text-ink-600 mb-1">{v}</label>
                        <input
                          type="text"
                          value={variableValues[v] || ''}
                          onChange={(e) => setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))}
                          placeholder={`输入{{${v}}}的值`}
                          className="input-base w-full h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-ink-700 mb-2">预览效果</div>
                <div className="bg-ink-50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
                  {renderPreview(selectedTemplate.content, variableValues).map((part, i) =>
                    part.isVar ? (
                      <span key={i} className="text-brand-600 bg-brand-50 px-0.5 rounded">{part.text}</span>
                    ) : (
                      <span key={i} className="text-ink-900">{part.text}</span>
                    )
                  )}
                </div>
                {!canNext && (
                  <div className="text-[11px] text-danger-500 mt-1.5">请填写所有变量</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-between">
          <button onClick={onClose} className="btn-secondary btn-sm">取消</button>
          <div className="flex gap-2">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="btn-secondary btn-sm">上一步</button>}
            {step === 3 && selectedTemplate?.variables.length ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext} className={cn('btn-primary btn-sm', !canNext && 'opacity-50 cursor-not-allowed')}>下一步</button>
            ) : step < totalSteps ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext} className={cn('btn-primary btn-sm', !canNext && 'opacity-50 cursor-not-allowed')}>下一步</button>
            ) : (
              <button onClick={handleCreate} disabled={!canNext} className={cn('btn-primary btn-sm', !canNext && 'opacity-50 cursor-not-allowed')}>创建任务</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
