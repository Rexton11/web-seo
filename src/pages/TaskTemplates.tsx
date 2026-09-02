import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, FileText, X } from 'lucide-react';

interface TemplateTask {
  title: string;
  description?: string;
  subtasks?: { title: string }[];
}

interface Template {
  id: string;
  name: string;
  description?: string;
  tasks: TemplateTask[];
}

export default function TaskTemplates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const subtaskInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const getToken = async () => user ? await user.getIdToken() : '';

  const fetchTemplates = async () => {
    const token = await getToken();
    const res = await fetch('/api/task-templates', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.map((t: any) => ({
        ...t,
        tasks: typeof t.tasks === 'string' ? JSON.parse(t.tasks) : (t.tasks || []),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { if (user) fetchTemplates(); }, [user]);

  const doSave = useCallback(async (template: Template) => {
    if (!template.name.trim()) return;
    setSaving(true);
    const token = await getToken();
    const cleanTasks = template.tasks
      .filter(t => t.title.trim())
      .map(t => ({
        title: t.title.trim(),
        description: t.description?.trim() || undefined,
        subtasks: (t.subtasks || []).filter(s => s.title.trim()),
      }));

    const body = { name: template.name, description: template.description || null, tasks: cleanTasks };

    if (template.id) {
      await fetch(`/api/task-templates/${template.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      const res = await fetch('/api/task-templates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created = await res.json();
        template.id = created.id;
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    fetchTemplates();
  }, [user]);

  const scheduleAutoSave = useCallback((template: Template) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(template), 1200);
  }, [doSave]);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  const updateEditing = (updated: Template) => {
    setEditing(updated);
    scheduleAutoSave(updated);
  };

  const createTemplate = () => {
    setEditing({
      id: '',
      name: '',
      description: '',
      tasks: [{ title: '', subtasks: [] }],
    });
  };

  const handleBack = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      if (editing && editing.name.trim()) await doSave(editing);
    }
    setEditing(null);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Удалить шаблон?')) return;
    const token = await getToken();
    await fetch(`/api/task-templates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent, ti: number) => {
    if (e.key === 'Enter' && !e.shiftKey && editing) {
      e.preventDefault();
      const newTasks = [...editing.tasks];
      newTasks.splice(ti + 1, 0, { title: '', subtasks: [] });
      const updated = { ...editing, tasks: newTasks };
      setEditing(updated);
      scheduleAutoSave(updated);
      setTimeout(() => taskInputRefs.current.get(ti + 1)?.focus(), 50);
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent, ti: number, si: number) => {
    if (e.key === 'Enter' && !e.shiftKey && editing) {
      e.preventDefault();
      const newTasks = [...editing.tasks];
      const subs = [...(newTasks[ti].subtasks || [])];
      subs.splice(si + 1, 0, { title: '' });
      newTasks[ti] = { ...newTasks[ti], subtasks: subs };
      const updated = { ...editing, tasks: newTasks };
      setEditing(updated);
      scheduleAutoSave(updated);
      setTimeout(() => subtaskInputRefs.current.get(`${ti}-${si + 1}`)?.focus(), 50);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>;

  if (editing) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-blue-500 mb-6">
            <ArrowLeft className="w-4 h-4" /> Назад к шаблонам
          </button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{editing.id ? 'Редактировать шаблон' : 'Новый шаблон'}</h1>
            <span className={`text-xs transition-opacity ${saving ? 'text-blue-500 opacity-100' : saved ? 'text-green-500 opacity-100' : 'opacity-0'}`}>
              {saving ? 'Сохранение...' : saved ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Сохранено</span> : ''}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Название шаблона</label>
              <input value={editing.name} onChange={e => updateEditing({ ...editing, name: e.target.value })}
                placeholder="Например: Разработка интернет-магазина"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Описание (необязательно)</label>
              <input value={editing.description || ''} onChange={e => updateEditing({ ...editing, description: e.target.value })}
                placeholder="Краткое описание шаблона"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-4">Задачи шаблона</h2>

          <div className="space-y-3 mb-6">
            {editing.tasks.map((task, ti) => (
              <div key={ti} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-400 font-mono w-6">{ti + 1}.</span>
                  <input
                    ref={el => { if (el) taskInputRefs.current.set(ti, el); }}
                    value={task.title}
                    onChange={e => {
                      const newTasks = [...editing.tasks];
                      newTasks[ti] = { ...newTasks[ti], title: e.target.value };
                      updateEditing({ ...editing, tasks: newTasks });
                    }}
                    onKeyDown={e => handleTaskKeyDown(e, ti)}
                    placeholder="Название задачи"
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
                  <button onClick={() => {
                    const updated = { ...editing, tasks: editing.tasks.filter((_, i) => i !== ti) };
                    updateEditing(updated);
                  }} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>

                {(task.subtasks || []).length > 0 && (
                  <div className="ml-8 space-y-1.5 mb-2">
                    {task.subtasks!.map((sub, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="text-xs text-slate-300">-</span>
                        <input
                          ref={el => { if (el) subtaskInputRefs.current.set(`${ti}-${si}`, el); }}
                          value={sub.title}
                          onChange={e => {
                            const newTasks = [...editing.tasks];
                            const subs = [...(newTasks[ti].subtasks || [])];
                            subs[si] = { title: e.target.value };
                            newTasks[ti] = { ...newTasks[ti], subtasks: subs };
                            updateEditing({ ...editing, tasks: newTasks });
                          }}
                          onKeyDown={e => handleSubtaskKeyDown(e, ti, si)}
                          placeholder="Подзадача"
                          className="flex-1 px-2 py-1 border border-slate-100 rounded text-xs focus:outline-none focus:border-blue-500" />
                        <button onClick={() => {
                          const newTasks = [...editing.tasks];
                          newTasks[ti] = { ...newTasks[ti], subtasks: (newTasks[ti].subtasks || []).filter((_, i) => i !== si) };
                          updateEditing({ ...editing, tasks: newTasks });
                        }} className="text-slate-200 hover:text-red-400"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => {
                  const newTasks = [...editing.tasks];
                  const subs = [...(newTasks[ti].subtasks || []), { title: '' }];
                  newTasks[ti] = { ...newTasks[ti], subtasks: subs };
                  const updated = { ...editing, tasks: newTasks };
                  updateEditing(updated);
                  setTimeout(() => subtaskInputRefs.current.get(`${ti}-${subs.length - 1}`)?.focus(), 50);
                }} className="ml-8 text-xs text-blue-500 hover:text-blue-600">+ Подзадача</button>
              </div>
            ))}
          </div>

          <button onClick={() => {
            const updated = { ...editing, tasks: [...editing.tasks, { title: '', subtasks: [] }] };
            setEditing(updated);
            scheduleAutoSave(updated);
            setTimeout(() => taskInputRefs.current.get(editing.tasks.length)?.focus(), 50);
          }}
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium mb-8">
            <Plus className="w-4 h-4" /> Добавить задачу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tasks')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Шаблоны задач</h1>
          </div>
          <button onClick={createTemplate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600">
            <Plus className="w-4 h-4" /> Новый шаблон
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="mb-2">Нет шаблонов задач</p>
            <p className="text-sm">Создайте шаблон для повторяющихся проектов, например "Разработка интернет-магазина"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800">{tmpl.name}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(tmpl)}
                      className="text-sm text-blue-500 hover:text-blue-600">Редактировать</button>
                    <button onClick={() => deleteTemplate(tmpl.id)}
                      className="text-sm text-red-400 hover:text-red-500">Удалить</button>
                  </div>
                </div>
                {tmpl.description && <p className="text-sm text-slate-500 mb-3">{tmpl.description}</p>}
                <div className="space-y-1">
                  {tmpl.tasks.slice(0, 5).map((t: TemplateTask, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-4 h-4 rounded-[3px] border-2 border-slate-300 flex-shrink-0" />
                      <span>{t.title}</span>
                      {t.subtasks && t.subtasks.length > 0 && (
                        <span className="text-xs text-slate-400">({t.subtasks.length} подзадач)</span>
                      )}
                    </div>
                  ))}
                  {tmpl.tasks.length > 5 && (
                    <p className="text-xs text-slate-400 ml-6">ещё {tmpl.tasks.length - 5} задач...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
