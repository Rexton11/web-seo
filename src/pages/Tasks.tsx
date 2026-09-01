import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Task, Project, TaskColumn } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Inbox, ListTodo, FolderOpen, LayoutGrid, List, ChevronRight, ChevronDown,
  Flag, Calendar, Trash2, Check, X, MoreHorizontal, GripVertical, Clock,
  AlertCircle, Folder, FolderPlus, Archive, FileText, Copy, ExternalLink
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const PRIORITY_CONFIG = [
  { value: 0, label: 'Без приоритета', color: 'text-slate-300', bg: '' },
  { value: 1, label: 'Низкий', color: 'text-blue-400', bg: 'bg-blue-50' },
  { value: 2, label: 'Средний', color: 'text-amber-500', bg: 'bg-amber-50' },
  { value: 3, label: 'Высокий', color: 'text-orange-500', bg: 'bg-orange-50' },
  { value: 4, label: 'Срочный', color: 'text-red-500', bg: 'bg-red-50' },
];

const DEFAULT_COLUMNS: TaskColumn[] = [
  { id: 'inbox', label: 'Входящие', color: 'bg-slate-50 border-slate-200 text-slate-700', order: 0 },
  { id: 'todo', label: 'К выполнению', color: 'bg-blue-50 border-blue-200 text-blue-700', order: 1 },
  { id: 'in_progress', label: 'В работе', color: 'bg-amber-50 border-amber-200 text-amber-700', order: 2 },
  { id: 'review', label: 'На проверке', color: 'bg-purple-50 border-purple-200 text-purple-700', order: 3 },
  { id: 'done', label: 'Готово', color: 'bg-green-50 border-green-200 text-green-700', order: 4 },
];

export default function Tasks() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban'>(searchParams.get('view') as any || 'list');
  const [filter, setFilter] = useState<'inbox' | 'all' | string>(searchParams.get('filter') || 'all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const COLUMNS: TaskColumn[] = settings?.taskColumns?.sort((a: TaskColumn, b: TaskColumn) => a.order - b.order) || DEFAULT_COLUMNS;

  const getToken = async () => user ? await user.getIdToken() : '';

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const token = await getToken();
    const [tasksRes, projectsRes] = await Promise.all([
      fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      setTasks(data.map((t: any) => ({ ...t, tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : (t.tags || []) })));
    }
    if (projectsRes.ok) setProjects(await projectsRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const fetchTemplates = async () => {
    const token = await getToken();
    const res = await fetch('/api/task-templates', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTemplates(await res.json());
  };

  const parentTasks = useMemo(() => tasks.filter(t => !t.parentId), [tasks]);
  const subtasksMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.filter(t => t.parentId).forEach(t => {
      if (!map[t.parentId!]) map[t.parentId!] = [];
      map[t.parentId!].push(t);
    });
    return map;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = parentTasks;
    if (filter === 'inbox') {
      result = result.filter(t => t.status === 'inbox');
    } else if (filter !== 'all') {
      result = result.filter(t => t.projectId === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }
    return result;
  }, [parentTasks, filter, search]);

  const createTask = async (overrides: Partial<Task> = {}) => {
    if (!newTitle.trim() && !overrides.title) return;
    const token = await getToken();
    const body: any = {
      title: overrides.title || newTitle.trim(),
      status: filter === 'inbox' || filter === 'all' ? 'inbox' : (overrides.status || 'inbox'),
      projectId: filter !== 'inbox' && filter !== 'all' ? filter : null,
      ...overrides,
    };
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const task = await res.json();
      task.tags = task.tags || [];
      setTasks([...tasks, task]);
      setNewTitle('');
      setCreating(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const token = await getToken();
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Удалить задачу?')) return;
    const token = await getToken();
    await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTasks(tasks.filter(t => t.id !== id && t.parentId !== id));
  };

  const toggleComplete = async (task: Task) => {
    const isDone = COLUMNS.length > 0 ? task.status === COLUMNS[COLUMNS.length - 1].id : task.status === 'done';
    const newStatus = isDone ? 'inbox' : (COLUMNS.length > 0 ? COLUMNS[COLUMNS.length - 1].id : 'done');
    const completedAt = isDone ? null : new Date().toISOString();
    await updateTask(task.id, { status: newStatus, completedAt: completedAt as any });
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const token = await getToken();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName.trim(), color: newProjectColor }),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects([...projects, project]);
      setNewProjectName('');
      setShowProjectModal(false);
      setFilter(project.id);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Удалить проект? Задачи останутся без проекта.')) return;
    const token = await getToken();
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setProjects(projects.filter(p => p.id !== projectId));
    setTasks(tasks.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t));
    if (filter === projectId) setFilter('all');
  };

  const applyTemplate = async (templateId: string) => {
    const token = await getToken();
    const projectId = filter !== 'inbox' && filter !== 'all' ? filter : null;
    await fetch(`/api/task-templates/${templateId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    setShowTemplateModal(false);
    fetchAll();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
      const isLastCol = COLUMNS.length > 0 && targetStatus === COLUMNS[COLUMNS.length - 1].id;
      await updateTask(taskId, {
        status: targetStatus,
        completedAt: isLastCol ? new Date().toISOString() as any : null,
      });
    }
  };

  const getDueDateLabel = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isToday(date)) return { text: 'Сегодня', className: 'text-amber-600 bg-amber-50' };
    if (isTomorrow(date)) return { text: 'Завтра', className: 'text-blue-600 bg-blue-50' };
    if (isPast(date)) return { text: format(date, 'd MMM', { locale: ru }), className: 'text-red-600 bg-red-50' };
    return { text: format(date, 'd MMM', { locale: ru }), className: 'text-slate-500 bg-slate-50' };
  };

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = { inbox: 0, all: parentTasks.length };
    parentTasks.forEach(t => {
      if (t.status === 'inbox') counts.inbox++;
      if (t.projectId) {
        counts[t.projectId] = (counts[t.projectId] || 0) + 1;
      }
    });
    return counts;
  }, [parentTasks]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>;

  return (
    <div className="h-full flex bg-slate-50">
      {/* Left sidebar - filters & projects */}
      <div className="w-60 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Задачи</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-2 space-y-0.5">
            <button onClick={() => setFilter('inbox')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Inbox className="w-4 h-4" />
              <span className="flex-1 text-left">Входящие</span>
              {taskCounts.inbox > 0 && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{taskCounts.inbox}</span>}
            </button>
            <button onClick={() => setFilter('all')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <ListTodo className="w-4 h-4" />
              <span className="flex-1 text-left">Все задачи</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{taskCounts.all}</span>
            </button>
          </div>

          <div className="mt-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Проекты</span>
              <button onClick={() => setShowProjectModal(true)} className="text-slate-400 hover:text-blue-500 p-0.5"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-0.5">
              {projects.filter(p => !p.archived).map(project => (
                <div key={project.id} className="group flex items-center">
                  <button onClick={() => setFilter(project.id)}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === project.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="flex-1 text-left truncate">{project.name}</span>
                    {(taskCounts[project.id] || 0) > 0 && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{taskCounts[project.id]}</span>}
                  </button>
                  <button onClick={() => deleteProject(project.id)}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              {projects.filter(p => !p.archived).length === 0 && (
                <p className="text-xs text-slate-400 px-3 py-2">Нет проектов</p>
              )}
            </div>
          </div>

          <div className="mt-4 px-4">
            <button onClick={() => { fetchTemplates(); setShowTemplateModal(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              Шаблоны задач
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">
              {filter === 'inbox' ? 'Входящие' : filter === 'all' ? 'Все задачи' : projects.find(p => p.id === filter)?.name || 'Задачи'}
            </h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
              className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-48" />
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
            <Plus className="w-4 h-4" /> Задача
          </button>
        </div>

        {/* Create task inline */}
        {creating && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createTask(); if (e.key === 'Escape') { setCreating(false); setNewTitle(''); } }}
              placeholder="Название задачи..."
              className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            <button onClick={() => createTask()} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Создать</button>
            <button onClick={() => { setCreating(false); setNewTitle(''); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {view === 'list' ? (
            <ListView
              tasks={filteredTasks}
              subtasksMap={subtasksMap}
              projects={projects}
              columns={COLUMNS}
              expandedTasks={expandedTasks}
              setExpandedTasks={setExpandedTasks}
              updateTask={updateTask}
              deleteTask={deleteTask}
              toggleComplete={toggleComplete}
              getDueDateLabel={getDueDateLabel}
              navigate={navigate}
              createTask={async (overrides) => {
                const token = await getToken();
                const body: any = { title: 'Подзадача', status: 'inbox', ...overrides };
                const res = await fetch('/api/tasks', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                if (res.ok) {
                  const t = await res.json();
                  t.tags = t.tags || [];
                  setTasks(prev => [...prev, t]);
                }
              }}
            />
          ) : (
            <KanbanView
              tasks={filteredTasks}
              columns={COLUMNS}
              updateTask={updateTask}
              handleDragStart={handleDragStart}
              handleDrop={handleDrop}
              toggleComplete={toggleComplete}
              getDueDateLabel={getDueDateLabel}
              projects={projects}
              navigate={navigate}
            />
          )}
        </div>
      </div>

      {/* Create project modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowProjectModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Новый проект</h3>
            <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createProject(); }}
              placeholder="Название проекта"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:border-blue-500" />
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-600">Цвет:</span>
              {['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'].map(c => (
                <button key={c} onClick={() => setNewProjectColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${newProjectColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Отмена</button>
              <button onClick={createProject} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* Templates modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Шаблоны задач</h3>
              <button onClick={() => navigate('/tasks/templates')} className="text-sm text-blue-500 hover:text-blue-600">Управление</button>
            </div>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет шаблонов</p>
                <button onClick={() => { setShowTemplateModal(false); navigate('/tasks/templates'); }}
                  className="mt-2 text-sm text-blue-500 hover:underline">Создать шаблон</button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(tmpl => {
                  const tmplTasks = typeof tmpl.tasks === 'string' ? JSON.parse(tmpl.tasks) : (tmpl.tasks || []);
                  return (
                    <div key={tmpl.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-800">{tmpl.name}</h4>
                        <button onClick={() => applyTemplate(tmpl.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                          <Copy className="w-3 h-3" /> Применить
                        </button>
                      </div>
                      {tmpl.description && <p className="text-xs text-slate-500 mb-2">{tmpl.description}</p>}
                      <p className="text-xs text-slate-400">{tmplTasks.length} задач</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({ tasks, subtasksMap, projects, columns, expandedTasks, setExpandedTasks, updateTask, deleteTask, toggleComplete, getDueDateLabel, navigate, createTask }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const lastCol = columns.length > 0 ? columns[columns.length - 1].id : 'done';

  const startEdit = (task: any) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = async (id: string) => {
    if (editTitle.trim()) await updateTask(id, { title: editTitle.trim() });
    setEditingId(null);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTasks);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedTasks(next);
  };

  const addSubtask = async (parentId: string) => {
    if (!subtaskTitle.trim()) return;
    await createTask({ title: subtaskTitle.trim(), parentId, status: 'inbox' });
    setSubtaskTitle('');
    setAddingSubtask(null);
    const next = new Set(expandedTasks);
    next.add(parentId);
    setExpandedTasks(next);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <ListTodo className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">Нет задач</p>
      </div>
    );
  }

  const renderTask = (task: any, isSubtask = false) => {
    const isDone = task.status === lastCol;
    const priority = PRIORITY_CONFIG.find(p => p.value === task.priority) || PRIORITY_CONFIG[0];
    const subs = subtasksMap[task.id] || [];
    const hasSubtasks = subs.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const project = projects.find((p: any) => p.id === task.projectId);
    const completedSubs = subs.filter((s: any) => s.status === lastCol).length;

    return (
      <div key={task.id}>
        <div className={`group flex items-center gap-2 px-6 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors ${isSubtask ? 'pl-14' : ''} ${isDone ? 'opacity-60' : ''}`}>
          {!isSubtask && hasSubtasks && (
            <button onClick={() => toggleExpand(task.id)} className="p-0.5 text-slate-400 hover:text-slate-600">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          {!isSubtask && !hasSubtasks && <div className="w-4.5" />}

          <button onClick={() => toggleComplete(task)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}>
            {isDone && <Check className="w-3 h-3 text-white" />}
          </button>

          {editingId === task.id ? (
            <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null); }}
              onBlur={() => saveEdit(task.id)}
              className="flex-1 px-2 py-0.5 text-sm border border-blue-300 rounded focus:outline-none" />
          ) : (
            <span onClick={() => startEdit(task)}
              className={`flex-1 text-sm cursor-pointer ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.title}
            </span>
          )}

          {hasSubtasks && !isSubtask && (
            <span className="text-xs text-slate-400">{completedSubs}/{subs.length}</span>
          )}

          {task.dealId && (
            <button onClick={() => navigate(`/deal/${task.dealId}`)} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5" title="Связанная сделка">
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {project && !isSubtask && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>
          )}

          {task.dueDate && (() => {
            const dl = getDueDateLabel(task.dueDate);
            return <span className={`text-xs px-1.5 py-0.5 rounded ${dl.className}`}>{dl.text}</span>;
          })()}

          {task.priority > 0 && (
            <Flag className={`w-3.5 h-3.5 ${priority.color}`} fill="currentColor" />
          )}

          {/* Priority selector */}
          <select value={task.priority} onChange={e => updateTask(task.id, { priority: parseInt(e.target.value) })}
            className="opacity-0 group-hover:opacity-100 text-xs border-none bg-transparent cursor-pointer focus:outline-none w-6 text-slate-400">
            {PRIORITY_CONFIG.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {/* Status selector */}
          <select value={task.status} onChange={e => {
            const isLast = columns.length > 0 && e.target.value === columns[columns.length - 1].id;
            updateTask(task.id, { status: e.target.value, completedAt: isLast ? new Date().toISOString() as any : null });
          }}
            className="opacity-0 group-hover:opacity-100 text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white cursor-pointer focus:outline-none">
            {columns.map((c: TaskColumn) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          {/* Date picker */}
          <input type="date" value={task.dueDate || ''} onChange={e => updateTask(task.id, { dueDate: e.target.value || null } as any)}
            className="opacity-0 group-hover:opacity-100 text-xs border border-slate-200 rounded px-1 py-0.5 bg-white cursor-pointer focus:outline-none w-8 text-slate-400" />

          {!isSubtask && (
            <button onClick={() => { setAddingSubtask(task.id); setSubtaskTitle(''); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-blue-500" title="Добавить подзадачу">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          <button onClick={() => deleteTask(task.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {isExpanded && subs.map((sub: any) => renderTask(sub, true))}

        {addingSubtask === task.id && (
          <div className="flex items-center gap-2 pl-14 pr-6 py-2 bg-blue-50 border-b border-blue-100">
            <input autoFocus value={subtaskTitle} onChange={e => setSubtaskTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSubtask(task.id); if (e.key === 'Escape') setAddingSubtask(null); }}
              placeholder="Подзадача..."
              className="flex-1 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:border-blue-500" />
            <button onClick={() => addSubtask(task.id)} className="text-xs text-blue-500 hover:text-blue-600 font-medium">Добавить</button>
            <button onClick={() => setAddingSubtask(null)} className="text-slate-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    );
  };

  const incompleteTasks = tasks.filter((t: any) => t.status !== lastCol);
  const completedTasks = tasks.filter((t: any) => t.status === lastCol);

  return (
    <div>
      {incompleteTasks.map((t: any) => renderTask(t))}
      {completedTasks.length > 0 && (
        <>
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Завершённые ({completedTasks.length})</span>
          </div>
          {completedTasks.map((t: any) => renderTask(t))}
        </>
      )}
    </div>
  );
}

function KanbanView({ tasks, columns, updateTask, handleDragStart, handleDrop, toggleComplete, getDueDateLabel, projects, navigate }: any) {
  const lastCol = columns.length > 0 ? columns[columns.length - 1].id : 'done';

  return (
    <div className="flex gap-4 p-6 h-full overflow-x-auto">
      {columns.map((col: TaskColumn) => {
        const colTasks = tasks.filter((t: any) => t.status === col.id);
        return (
          <div key={col.id}
            className="flex flex-col flex-shrink-0 w-72 bg-slate-100/60 rounded-xl border border-slate-200 overflow-hidden"
            onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.id)}>
            <div className={`px-4 py-3 border-b border-slate-200 ${col.color.split(' ')[0]}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${col.color.split(' ')[2]}`}>{col.label}</span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs opacity-70">{colTasks.length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {colTasks.map((task: any) => {
                const isDone = task.status === lastCol;
                const priority = PRIORITY_CONFIG.find((p: any) => p.value === task.priority) || PRIORITY_CONFIG[0];
                const project = projects.find((p: any) => p.id === task.projectId);

                return (
                  <div key={task.id} draggable onDragStart={e => handleDragStart(e, task.id)}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all">
                    <div className="flex items-start gap-2 mb-1">
                      <button onClick={() => toggleComplete(task)}
                        className={`w-4.5 h-4.5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}>
                        {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <span className={`text-sm font-medium flex-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</span>
                      {task.priority > 0 && <Flag className={`w-3.5 h-3.5 flex-shrink-0 ${priority.color}`} fill="currentColor" />}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {project && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>
                      )}
                      {task.dueDate && (() => {
                        const dl = getDueDateLabel(task.dueDate);
                        return <span className={`text-[10px] px-1.5 py-0.5 rounded ${dl.className}`}><Calendar className="w-2.5 h-2.5 inline mr-0.5" />{dl.text}</span>;
                      })()}
                      {task.dealId && (
                        <button onClick={() => navigate(`/deal/${task.dealId}`)}
                          className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
                          <ExternalLink className="w-2.5 h-2.5" /> Сделка
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div className="h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                  Перетащите сюда
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
