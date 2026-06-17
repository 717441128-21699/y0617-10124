
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Pause, Calendar, Clock, Users2, Trash2, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber } from '@/utils/format';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/utils/constants';
import { formatDateTime, formatDate } from '@/utils/date';
import type { ScheduleTask, TaskStatus } from '@/types';

export function ScheduleTasksPage() {
  const navigate = useNavigate();
  const { tasks, groups } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const filtered = tasks.filter((t) => statusFilter === 'all' || t.status === statusFilter);

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
          <div className="relative">
            <button className="btn-secondary btn-sm flex items-center gap-1 h-9">
              状态筛选
              <ChevronDown size={13} />
            </button>
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
              <div className="text-[11px] text-ink-400">占比 {formatPercentSafe(list.length / tasks.length)}</div>
            </div>
          );
        })}
      </div>

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
              <TaskRow key={task.id} task={task} groupsCount={groups.length} />
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <CreateTaskModal onClose={() => setShowModal(false)} groups={groups} />}
    </div>
  );
}

function formatPercentSafe(v: number): string {
  return (v * 100).toFixed(0) + '%';
}

function TaskRow({ task, groupsCount }: { task: ScheduleTask; groupsCount: number }) {
  return (
    <tr className="table-row group">
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
        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="btn-ghost btn-sm !p-1.5" title={task.status === 'running' ? '暂停' : '启动'}>
            {task.status === 'running' ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button className="btn-ghost btn-sm !p-1.5 text-danger-500" title="删除"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

function CreateTaskModal({ onClose, groups }: { onClose: () => void; groups: any[] }) {
  const [step, setStep] = useState(1);
  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-xl overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900">新建定时任务</h3>
            <p className="text-[11px] text-ink-400 mt-0.5">步骤 {step}/3 · {['选择模板', '设置时间', '选择目标群'][step - 1]}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm !p-1.5">✕</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                  i <= step ? 'bg-accent-500 text-white' : 'bg-ink-100 text-ink-400'
                )}>{i}</div>
                {i < 3 && <div className={cn('flex-1 h-0.5 mx-1.5 rounded', i < step ? 'bg-accent-500' : 'bg-ink-100')} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-2">选择消息模板</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {['新人入群欢迎语', '周一早间问候', '每周运营数据报告', '618大促活动通知', '会员专属福利'].map((t, i) => (
                  <label key={t} className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-accent-200 hover:bg-accent-50/30 cursor-pointer transition-all">
                    <input type="radio" name="tpl" defaultChecked={i === 0} className="text-accent-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-ink-900">{t}</div>
                      <div className="text-[11px] text-ink-400 mt-0.5">包含变量 {`{{昵称}}`} {`{{群名称}}`} 等</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-2">推送频率</label>
                <div className="grid grid-cols-2 gap-2">
                  {['每天固定时间', '每周特定时间', '每月固定日期', '自定义Cron'].map((x, i) => (
                    <label key={x} className="p-3 rounded-xl border border-ink-100 hover:border-accent-200 hover:bg-accent-50/30 cursor-pointer transition-all">
                      <input type="radio" name="freq" defaultChecked={i === 1} className="text-accent-600 mb-1" />
                      <div className="text-xs font-medium text-ink-900">{x}</div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">具体时间</label>
                  <input type="time" defaultValue="09:00" className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">执行星期</label>
                  <div className="flex gap-1">
                    {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
                      <span key={d} className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-colors',
                        i === 0 ? 'bg-accent-500 text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                      )}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-2">选择目标社群 ({groups.length}个可选)</label>
              <div className="border border-ink-200 rounded-xl p-2 mb-3">
                <div className="flex gap-2 pb-2 border-b border-ink-100 mb-2">
                  <button className="text-xs text-accent-600 font-medium px-2 py-1 rounded-md bg-accent-50">全选</button>
                  <button className="text-xs text-ink-500 px-2 py-1 rounded-md hover:bg-ink-50">仅付费会员群</button>
                  <button className="text-xs text-ink-500 px-2 py-1 rounded-md hover:bg-ink-50">仅新客群</button>
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {groups.slice(0, 8).map((g) => (
                    <label key={g.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-ink-50 cursor-pointer">
                      <input type="checkbox" defaultChecked className="text-accent-600 rounded" />
                      <span className="text-xs text-ink-700 flex-1">{g.name}</span>
                      <span className="text-[10px] text-ink-400">{g.memberCount}人</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-between">
          <button onClick={onClose} className="btn-secondary btn-sm">取消</button>
          <div className="flex gap-2">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="btn-secondary btn-sm">上一步</button>}
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary btn-sm">下一步</button>
            ) : (
              <button onClick={onClose} className="btn-primary btn-sm">创建任务</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
