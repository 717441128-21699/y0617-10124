
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Clock, Edit3, Trash2, Copy, Eye, Send, FileText, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber, truncateText } from '@/utils/format';
import { TEMPLATE_CATEGORY_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/date';
import type { MessageTemplate, TemplateCategory, Group, Member } from '@/types';

const CATEGORY_FILTERS: Array<{ value: TemplateCategory | 'all'; label: string }> = [
  { value: 'all', label: '全部分类' },
  { value: 'welcome', label: '欢迎语' },
  { value: 'weekly_report', label: '周报告' },
  { value: 'promotion', label: '促销活动' },
  { value: 'after_sale', label: '售后服务' },
  { value: 'notice', label: '通知公告' },
  { value: 'custom', label: '自定义' },
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

export function TemplatesListPage() {
  const navigate = useNavigate();
  const { templates, deleteTemplate, addTemplate, updateTemplate, groups, members } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTargetType, setSendTargetType] = useState<'group' | 'member'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const groupList: Group[] = groups;
  const memberList: Member[] = members;

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TemplateCategory>('welcome');
  const [formVariables, setFormVariables] = useState('');
  const [formContent, setFormContent] = useState('');
  const [variableExamples, setVariableExamples] = useState<Record<string, string>>({});

  const [previewVariableExamples, setPreviewVariableExamples] = useState<Record<string, string>>({});

  useEffect(() => {
    if (showEditorModal) {
      if (editingId) {
        const tpl = templates.find((t) => t.id === editingId);
        if (tpl) {
          setFormTitle(tpl.title);
          setFormCategory(tpl.category);
          setFormVariables(tpl.variables.join(','));
          setFormContent(tpl.content);
        }
      } else {
        setFormTitle('');
        setFormCategory('welcome');
        setFormVariables('');
        setFormContent('');
      }
      setVariableExamples({});
    }
  }, [showEditorModal, editingId, templates]);

  useEffect(() => {
    if (previewId) {
      setPreviewVariableExamples({});
    }
  }, [previewId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filtered = templates.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.content.includes(search)) return false;
    if (category !== 'all' && t.category !== category) return false;
    return true;
  });

  const previewTemplate = templates.find((t) => t.id === previewId);

  const parsedFormVariables = formVariables.split(',').map((v) => v.trim()).filter(Boolean);

  const handleCopy = (tpl: MessageTemplate) => {
    addTemplate({
      title: tpl.title + ' 副本',
      category: tpl.category,
      categoryLabel: tpl.categoryLabel,
      content: tpl.content,
      variables: tpl.variables,
      createdBy: '当前用户',
      lastUsedAt: new Date().toISOString().slice(0, 10),
    });
    setToast('模板已复制');
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    const variables = formVariables.split(',').map((v) => v.trim()).filter(Boolean);
    if (editingId) {
      updateTemplate(editingId, {
        title: formTitle,
        category: formCategory,
        categoryLabel: TEMPLATE_CATEGORY_LABELS[formCategory],
        content: formContent,
        variables,
      });
    } else {
      addTemplate({
        title: formTitle,
        category: formCategory,
        categoryLabel: TEMPLATE_CATEGORY_LABELS[formCategory],
        content: formContent,
        variables,
        createdBy: '当前用户',
        lastUsedAt: new Date().toISOString().slice(0, 10),
      });
    }
    setShowEditorModal(false);
    setEditingId(null);
  };

  const getSelectedTargetName = () => {
    if (sendTargetType === 'group' && selectedGroupId) {
      return groupList.find((g) => g.id === selectedGroupId)?.name || '';
    }
    if (sendTargetType === 'member' && selectedMemberId) {
      return memberList.find((m) => m.id === selectedMemberId)?.nickname || '';
    }
    return '';
  };

  const handleSendTest = () => {
    setSendSuccess(true);
    setTimeout(() => {
      setShowSendModal(false);
      setSendSuccess(false);
      setSelectedGroupId(null);
      setSelectedMemberId(null);
    }, 1500);
  };

  const editorPreviewParts = renderPreview(formContent, variableExamples);

  const previewParts = previewTemplate ? renderPreview(previewTemplate.content, previewVariableExamples) : [];

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900 tracking-tight">消息模板库</h1>
          <p className="text-sm text-ink-500 mt-1">共 <span className="font-semibold text-ink-900">{templates.length}</span> 个话术模板，累计使用 {formatNumber(templates.reduce((s, t) => s + t.usageCount, 0))} 次</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/templates/schedule')} className="btn-secondary btn-sm"><Clock size={14} />定时任务</button>
          <button onClick={() => { setEditingId(null); setShowEditorModal(true); }} className="btn-primary btn-sm"><Plus size={14} />新建模板</button>
        </div>
      </div>

      <div className="data-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索模板标题、内容..." className="input-base pl-9 h-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setCategory(f.value)}
                className={cn(
                  'px-3 h-8 rounded-lg text-xs font-medium transition-all',
                  category === f.value ? 'bg-accent-600 text-white shadow-sm' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                )}
              >{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            onDelete={deleteTemplate}
            onPreview={() => setPreviewId(tpl.id)}
            onSchedule={() => navigate('/templates/schedule')}
            onEdit={() => { setEditingId(tpl.id); setShowEditorModal(true); }}
            onCopy={() => handleCopy(tpl)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 data-card p-16 text-center text-ink-400">暂无匹配的模板</div>
        )}
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in" onClick={() => setPreviewId(null)}>
          <div className="bg-white rounded-2xl shadow-pop w-full max-w-lg overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-accent-600" />
                <h3 className="font-display font-semibold text-ink-900">模板预览</h3>
              </div>
              <button onClick={() => setPreviewId(null)} className="btn-ghost btn-sm !p-1.5">✕</button>
            </div>
            <div className="p-5 bg-ink-50/50 space-y-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink-900">{previewTemplate.title}</div>
                  <div className="text-[11px] text-ink-400 mt-0.5">
                    {TEMPLATE_CATEGORY_LABELS[previewTemplate.category]} · 创建：{formatDate(previewTemplate.createdAt)}
                  </div>
                </div>
                {previewTemplate.variables.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {previewTemplate.variables.map((v) => (
                      <span key={v} className="chip bg-brand-50 text-brand-600 border border-brand-100 font-mono">
                        {'{{' + v + '}}'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {previewTemplate.variables.length > 0 && (
                <div className="bg-white rounded-xl border border-ink-100 p-4 space-y-3">
                  <div className="text-xs font-medium text-ink-700">试填变量</div>
                  <div className="grid grid-cols-2 gap-3">
                    {previewTemplate.variables.map((v) => (
                      <div key={v}>
                        <label className="block text-xs text-ink-600 mb-1">{v}</label>
                        <input
                          type="text"
                          value={previewVariableExamples[v] || ''}
                          onChange={(e) => setPreviewVariableExamples((prev) => ({ ...prev, [v]: e.target.value }))}
                          placeholder={`输入{{${v}}}的示例值`}
                          className="input-base w-full h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl border border-ink-100 p-4 text-sm text-ink-700 leading-relaxed whitespace-pre-line">
                {previewTemplate.content}
              </div>
              <div>
                <div className="text-xs font-medium text-ink-700 mb-2">预览效果</div>
                <div className="bg-ink-50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
                  {previewParts.map((part, i) =>
                    part.isVar ? (
                      <span key={i} className="text-brand-600 bg-brand-50 px-0.5 rounded">{part.text}</span>
                    ) : (
                      <span key={i} className="text-ink-900">{part.text}</span>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-ink-100 flex justify-between">
              <button onClick={() => setPreviewId(null)} className="btn-secondary btn-sm">关闭</button>
              <div className="flex gap-2">
                <button onClick={() => { setShowSendModal(true); setSendSuccess(false); }} className="btn-ghost btn-sm"><Send size={13} />试发</button>
                <button onClick={() => { navigate('/templates/schedule'); setPreviewId(null); }} className="btn-primary btn-sm"><Send size={13} />使用此模板</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSendModal && previewTemplate && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-5 animate-fade-in" onClick={() => setShowSendModal(false)}>
          <div className="bg-white rounded-2xl shadow-pop w-full max-w-lg overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-accent-600" />
                <h3 className="font-display font-semibold text-ink-900">试发模拟</h3>
              </div>
              <button onClick={() => setShowSendModal(false)} className="btn-ghost btn-sm !p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {sendSuccess ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-success-50 flex items-center justify-center mb-3">
                    <CheckCircle2 size={32} className="text-success-500" />
                  </div>
                  <h4 className="text-lg font-display font-semibold text-ink-900 mb-2">发送成功！</h4>
                  <p className="text-sm text-ink-500">
                    已模拟发送到「{getSelectedTargetName()}」<br />
                    <span className="text-xs">{new Date().toLocaleString('zh-CN')}</span>
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-2">发送对象</label>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => { setSendTargetType('group'); setSelectedMemberId(null); }}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-medium transition-all border',
                          sendTargetType === 'group'
                            ? 'border-accent-500 bg-accent-50 text-accent-700'
                            : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                        )}
                      >发送到群</button>
                      <button
                        onClick={() => { setSendTargetType('member'); setSelectedGroupId(null); }}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-medium transition-all border',
                          sendTargetType === 'member'
                            ? 'border-accent-500 bg-accent-50 text-accent-700'
                            : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                        )}
                      >发送给成员</button>
                    </div>
                    <div className="border border-ink-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      {sendTargetType === 'group' ? (
                        groupList.map((g) => (
                          <label
                            key={g.id}
                            className="flex items-center gap-2 p-2 hover:bg-ink-50 cursor-pointer border-b border-ink-100 last:border-b-0"
                            onClick={() => setSelectedGroupId(g.id)}
                          >
                            <div className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              selectedGroupId === g.id ? 'border-accent-500' : 'border-ink-300'
                            )}>
                              {selectedGroupId === g.id && <div className="w-2 h-2 rounded-full bg-accent-500" />}
                            </div>
                            <span className="text-xs text-ink-700 flex-1">{g.name}</span>
                            <span className="text-[10px] text-ink-400">{g.memberCount}人</span>
                          </label>
                        ))
                      ) : (
                        memberList.slice(0, 20).map((m) => (
                          <label
                            key={m.id}
                            className="flex items-center gap-2 p-2 hover:bg-ink-50 cursor-pointer border-b border-ink-100 last:border-b-0"
                            onClick={() => setSelectedMemberId(m.id)}
                          >
                            <div className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              selectedMemberId === m.id ? 'border-accent-500' : 'border-ink-300'
                            )}>
                              {selectedMemberId === m.id && <div className="w-2 h-2 rounded-full bg-accent-500" />}
                            </div>
                            <span className="text-xs text-ink-700 flex-1">{m.nickname}</span>
                            <div className="flex gap-0.5">
                              {m.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="chip text-[9px] !px-1.5 !py-0 bg-ink-50 text-ink-500">{tag}</span>
                              ))}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-ink-700 mb-2">发送内容预览</div>
                    <div className="bg-ink-50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
                      {previewParts.map((part, i) =>
                        part.isVar ? (
                          <span key={i} className="text-brand-600 bg-brand-50 px-0.5 rounded">{part.text}</span>
                        ) : (
                          <span key={i} className="text-ink-900">{part.text}</span>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
              <button onClick={() => setShowSendModal(false)} className="btn-secondary btn-sm">取消</button>
              {!sendSuccess && (
                <button
                  onClick={handleSendTest}
                  disabled={!((sendTargetType === 'group' && selectedGroupId) || (sendTargetType === 'member' && selectedMemberId))}
                  className={cn('btn-primary btn-sm', !((sendTargetType === 'group' && selectedGroupId) || (sendTargetType === 'member' && selectedMemberId)) && 'opacity-50 cursor-not-allowed')}
                ><Send size={13} />发送</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditorModal && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in" onClick={() => { setShowEditorModal(false); setEditingId(null); }}>
          <div className="bg-white rounded-2xl shadow-pop w-full max-w-xl overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-ink-900">{editingId ? '编辑模板' : '新建模板'}</h3>
              <button onClick={() => { setShowEditorModal(false); setEditingId(null); }} className="btn-ghost btn-sm !p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">标题 <span className="text-danger-500">*</span></label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="请输入模板标题" className="input-base w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">分类</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as TemplateCategory)} className="input-base w-full">
                  {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[]).map((key) => (
                    <option key={key} value={key}>{TEMPLATE_CATEGORY_LABELS[key]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">变量</label>
                <input type="text" value={formVariables} onChange={(e) => setFormVariables(e.target.value)} placeholder="多个变量用逗号分隔" className="input-base w-full" />
              </div>
              {parsedFormVariables.length > 0 && (
                <div className="bg-ink-50/50 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-medium text-ink-700">变量示例</div>
                  <div className="grid grid-cols-2 gap-3">
                    {parsedFormVariables.map((v) => (
                      <div key={v}>
                        <label className="block text-xs text-ink-600 mb-1">{v}</label>
                        <input
                          type="text"
                          value={variableExamples[v] || ''}
                          onChange={(e) => setVariableExamples((prev) => ({ ...prev, [v]: e.target.value }))}
                          placeholder={`输入{{${v}}}的示例值`}
                          className="input-base w-full h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">内容</label>
                <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="支持 {{变量名}} 占位符" rows={6} className="input-base w-full resize-none" />
              </div>
              <div>
                <div className="text-xs font-medium text-ink-700 mb-2">预览效果</div>
                <div className="bg-ink-50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
                  {editorPreviewParts.map((part, i) =>
                    part.isVar ? (
                      <span key={i} className="text-brand-600 bg-brand-50 px-0.5 rounded">{part.text}</span>
                    ) : (
                      <span key={i} className="text-ink-900">{part.text}</span>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
              <button onClick={() => { setShowEditorModal(false); setEditingId(null); }} className="btn-secondary btn-sm">取消</button>
              <button onClick={handleSave} disabled={!formTitle.trim()} className="btn-primary btn-sm">保存</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-ink-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, onDelete, onPreview, onSchedule, onEdit, onCopy }: {
  template: MessageTemplate;
  onDelete: (id: string) => void;
  onPreview: () => void;
  onSchedule: () => void;
  onEdit: () => void;
  onCopy: () => void;
}) {
  const CATEGORY_STYLES: Record<TemplateCategory, string> = {
    welcome: 'bg-accent-50 text-accent-700',
    weekly_report: 'bg-brand-50 text-brand-700',
    promotion: 'bg-warning-50 text-warning-700',
    after_sale: 'bg-purple-50 text-purple-700',
    notice: 'bg-cyan-50 text-cyan-700',
    custom: 'bg-ink-50 text-ink-700',
  };

  return (
    <div className="data-card p-5 group hover:shadow-card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', CATEGORY_STYLES[template.category])}>
            <FileText size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-ink-900 truncate">{template.title}</h3>
              <span className={cn('badge text-[10px] !py-0', CATEGORY_STYLES[template.category])}>
                {TEMPLATE_CATEGORY_LABELS[template.category]}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-1 line-clamp-2 leading-relaxed">
              {truncateText(template.content.replace(/\{\{[^}]+\}\}/g, (m) => `「${m.slice(2, -2)}」`), 80)}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
          <button onClick={onPreview} className="btn-ghost btn-sm !p-1.5" title="预览"><Eye size={14} /></button>
          <button onClick={onEdit} className="btn-ghost btn-sm !p-1.5" title="编辑"><Edit3 size={14} /></button>
          <button onClick={onCopy} className="btn-ghost btn-sm !p-1.5" title="复制"><Copy size={14} /></button>
          <button onClick={() => onDelete(template.id)} className="btn-ghost btn-sm !p-1.5 text-danger-500" title="删除"><Trash2 size={14} /></button>
        </div>
      </div>
      {template.variables.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {template.variables.map((v) => (
            <span key={v} className="chip bg-ink-50 text-ink-600 border border-ink-100 font-mono text-[10px]">
              {'{{' + v + '}}'}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-ink-100">
        <div className="flex items-center gap-3 text-[11px] text-ink-400">
          <span>使用 <span className="font-display font-semibold text-ink-600">{template.usageCount}</span> 次</span>
          <span>上次：{formatDate(template.lastUsedAt)}</span>
          <span>by {template.createdBy}</span>
        </div>
        <button onClick={onSchedule} className="btn-primary btn-sm !py-1 !px-2.5 text-[11px]">
          <Send size={11} />定时发送
        </button>
      </div>
    </div>
  );
}
