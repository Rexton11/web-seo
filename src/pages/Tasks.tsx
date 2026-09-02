import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Task, Project, TaskColumn } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Inbox, ListTodo, FolderOpen, LayoutGrid, List, ChevronRight, ChevronDown,
  Flag, Calendar, Trash2, Check, X, MoreHorizontal, GripVertical, Clock,
  AlertCircle, Folder, FolderPlus, Archive, FileText, Copy, ExternalLink, AlignLeft,
  Sun, Sunrise, CalendarDays, ArrowUpDown, CheckSquare, Square, Paperclip, Download, Upload, KeyRound, Send
} from 'lucide-react';

interface ContextMenuState {
  x: number;
  y: number;
  taskIds: string[];
}
import { format, isPast, isToday, isTomorrow, parseISO, isThisWeek, addDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

type SortMode = 'manual' | 'priority' | 'dueDate' | 'alpha' | 'created';

const PRIORITY_CONFIG = [
  { value: 0, label: 'Без приоритета', color: 'text-slate-300', bg: '', flagColor: '' },
  { value: 1, label: 'Низкий', color: 'text-blue-400', bg: 'bg-blue-50', flagColor: 'text-blue-400' },
  { value: 2, label: 'Средний', color: 'text-amber-500', bg: 'bg-amber-50', flagColor: 'text-amber-500' },
  { value: 3, label: 'Высокий', color: 'text-orange-500', bg: 'bg-orange-50', flagColor: 'text-orange-500' },
  { value: 4, label: 'Срочный', color: 'text-red-500', bg: 'bg-red-50', flagColor: 'text-red-500' },
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
  const [filter, setFilter] = useState<'inbox' | 'all' | 'today' | 'tomorrow' | 'week' | string>(searchParams.get('filter') || 'all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [newTitle, setNewTitle] = useState('');
  const [bulkLines, setBulkLines] = useState<string[] | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const lastClickedTaskRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (tasks.length === 0) return;
    const lastCol = COLUMNS.length > 0 ? COLUMNS[COLUMNS.length - 1].id : 'done';
    const dueTodayTasks = tasks.filter(t => !t.parentId && t.dueDate && t.status !== lastCol && isToday(parseISO(t.dueDate)));
    const overdueTasks = tasks.filter(t => !t.parentId && t.dueDate && t.status !== lastCol && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)));
    if (dueTodayTasks.length > 0) {
      new Notification('Задачи на сегодня', { body: `У вас ${dueTodayTasks.length} задач на сегодня`, icon: '/favicon.ico' });
    }
    if (overdueTasks.length > 0) {
      new Notification('Просроченные задачи', { body: `У вас ${overdueTasks.length} просроченных задач`, icon: '/favicon.ico' });
    }
  }, [tasks.length > 0]);

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
      result = result.filter(t => !t.projectId);
    } else if (filter === 'today') {
      result = result.filter(t => t.dueDate && isToday(parseISO(t.dueDate)));
    } else if (filter === 'tomorrow') {
      result = result.filter(t => t.dueDate && isTomorrow(parseISO(t.dueDate)));
    } else if (filter === 'week') {
      result = result.filter(t => {
        if (!t.dueDate) return false;
        const d = parseISO(t.dueDate);
        return isThisWeek(d, { weekStartsOn: 1 }) || isToday(d);
      });
    } else if (filter !== 'all') {
      result = result.filter(t => t.projectId === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }
    if (sortMode === 'priority') {
      result = [...result].sort((a, b) => b.priority - a.priority);
    } else if (sortMode === 'dueDate') {
      result = [...result].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (sortMode === 'alpha') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    } else if (sortMode === 'created') {
      result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sortMode === 'manual') {
      result = [...result].sort((a, b) => a.order - b.order);
    }
    return result;
  }, [parentTasks, filter, search, sortMode]);

  const selectedTask = useMemo(() => selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null, [selectedTaskId, tasks]);

  const getTaskDefaults = () => {
    const isDateFilter = filter === 'today' || filter === 'tomorrow' || filter === 'week';
    return {
      status: 'inbox',
      projectId: !isDateFilter && filter !== 'inbox' && filter !== 'all' ? filter : null,
      dueDate: filter === 'today' ? format(new Date(), 'yyyy-MM-dd') : filter === 'tomorrow' ? format(addDays(new Date(), 1), 'yyyy-MM-dd') : null,
    };
  };

  const createTask = async (overrides: Partial<Task> = {}) => {
    if (!newTitle.trim() && !overrides.title) return;
    const token = await getToken();
    const defaults = getTaskDefaults();
    const body: any = {
      title: overrides.title || newTitle.trim(),
      ...defaults,
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
      setTasks(prev => [...prev, task]);
      setNewTitle('');
    }
  };

  const createBulkTasks = async (lines: string[]) => {
    const token = await getToken();
    const defaults = getTaskDefaults();
    const created: Task[] = [];
    for (const line of lines) {
      const title = line.replace(/^[\s\-\d.•*·]+/, '').trim();
      if (!title) continue;
      const body: any = { title, ...defaults };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const t = await res.json();
        t.tags = t.tags || [];
        created.push(t);
      }
    }
    setTasks(prev => [...prev, ...created]);
    setBulkLines(null);
    setNewTitle('');
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length >= 2) {
      e.preventDefault();
      setBulkLines(lines);
    }
  };

  const handleTaskClick = (taskId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
        return next;
      });
      lastClickedTaskRef.current = taskId;
      return;
    }
    if (e.shiftKey && lastClickedTaskRef.current) {
      const taskList = filteredTasks;
      const lastIdx = taskList.findIndex(t => t.id === lastClickedTaskRef.current);
      const curIdx = taskList.findIndex(t => t.id === taskId);
      if (lastIdx !== -1 && curIdx !== -1) {
        const start = Math.min(lastIdx, curIdx);
        const end = Math.max(lastIdx, curIdx);
        setSelectedTaskIds(prev => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) next.add(taskList[i].id);
          return next;
        });
      }
      return;
    }
    setSelectedTaskIds(new Set());
    setSelectedTaskId(selectedTaskId === taskId ? null : taskId);
    lastClickedTaskRef.current = taskId;
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    if (selectedTaskIds.size > 0 && !selectedTaskIds.has(taskId)) {
      setSelectedTaskIds(new Set([taskId]));
    } else if (selectedTaskIds.size === 0) {
      setSelectedTaskIds(new Set([taskId]));
    }
    const ids = selectedTaskIds.size > 0 && selectedTaskIds.has(taskId)
      ? Array.from(selectedTaskIds) : [taskId];
    setContextMenu({ x: e.clientX, y: e.clientY, taskIds: ids });
  };

  const bulkDeleteTasks = async (ids: string[]) => {
    if (!confirm(`Удалить ${ids.length} задач?`)) return;
    const token = await getToken();
    for (const id of ids) {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    }
    setTasks(prev => prev.filter(t => !ids.includes(t.id) && !ids.includes(t.parentId || '')));
    setSelectedTaskIds(new Set());
    if (selectedTaskId && ids.includes(selectedTaskId)) setSelectedTaskId(null);
    setContextMenu(null);
  };

  const bulkUpdateTasks = async (ids: string[], updates: Partial<Task>) => {
    const token = await getToken();
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
    for (const id of ids) {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    }
    setContextMenu(null);
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const createSubtask = async (overrides: Partial<Task>) => {
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
    if (selectedTaskId === id) setSelectedTaskId(null);
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
    const counts: Record<string, number> = { inbox: 0, all: parentTasks.length, today: 0, tomorrow: 0, week: 0 };
    parentTasks.forEach(t => {
      if (!t.projectId) counts.inbox++;
      if (t.projectId) {
        counts[t.projectId] = (counts[t.projectId] || 0) + 1;
      }
      if (t.dueDate) {
        const d = parseISO(t.dueDate);
        if (isToday(d)) counts.today++;
        if (isTomorrow(d)) counts.tomorrow++;
        if (isThisWeek(d, { weekStartsOn: 1 }) || isToday(d)) counts.week++;
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

          <div className="mt-3 px-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Даты</span>
          </div>
          <div className="px-2 space-y-0.5">
            <button onClick={() => setFilter('today')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'today' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Sun className="w-4 h-4" />
              <span className="flex-1 text-left">Сегодня</span>
              {taskCounts.today > 0 && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">{taskCounts.today}</span>}
            </button>
            <button onClick={() => setFilter('tomorrow')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'tomorrow' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Sunrise className="w-4 h-4" />
              <span className="flex-1 text-left">Завтра</span>
              {taskCounts.tomorrow > 0 && <span className="text-xs bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded-full">{taskCounts.tomorrow}</span>}
            </button>
            <button onClick={() => setFilter('week')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'week' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <CalendarDays className="w-4 h-4" />
              <span className="flex-1 text-left">На неделю</span>
              {taskCounts.week > 0 && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{taskCounts.week}</span>}
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

          {/* Project access notes */}
          {(() => {
            const selectedProject = projects.find((p: Project) => p.id === filter);
            if (!selectedProject) return null;
            return (
              <div className="mt-4 px-4 pb-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Доступы</span>
                </div>
                <textarea
                  value={selectedProject.accessNotes || ''}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, accessNotes: val } : p));
                  }}
                  onBlur={async (e) => {
                    try {
                      const idToken = await user!.getIdToken();
                      await fetch(`/api/projects/${selectedProject.id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accessNotes: e.target.value }),
                      });
                    } catch {}
                  }}
                  rows={4}
                  placeholder="SSH, FTP, хостинг, CMS, аналитика..."
                  className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-y bg-slate-50"
                />
              </div>
            );
          })()}

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
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-lg font-bold text-slate-800 flex-1">
              {filter === 'inbox' ? 'Входящие' : filter === 'all' ? 'Все задачи' : filter === 'today' ? 'Сегодня' : filter === 'tomorrow' ? 'Завтра' : filter === 'week' ? 'На неделю' : projects.find(p => p.id === filter)?.name || 'Задачи'}
            </h3>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-2 w-4 h-4 text-slate-400" />
              <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}
                className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer">
                <option value="manual">Порядок вручную</option>
                <option value="priority">По приоритету</option>
                <option value="dueDate">По дате</option>
                <option value="alpha">По алфавиту</option>
                <option value="created">По дате создания</option>
              </select>
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
          </div>

          {/* TickTick-style inline add task */}
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onPaste={handleInputPaste}
              onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) { createTask(); } }}
              placeholder="Добавить задачу..."
              className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none placeholder-slate-400 py-1"
            />
          </div>
        </div>

        {/* Bulk paste modal */}
        {bulkLines && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setBulkLines(null)}>
            <div className="bg-white rounded-xl shadow-xl p-6 w-[480px] max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Массовое добавление</h3>
              <p className="text-sm text-slate-500 mb-4">Обнаружено {bulkLines.length} строк. Создать отдельную задачу для каждой?</p>
              <div className="flex-1 overflow-y-auto space-y-1 mb-4 border border-slate-200 rounded-lg p-3 bg-slate-50">
                {bulkLines.map((line, i) => {
                  const cleaned = line.replace(/^[\s\-\d.•*·]+/, '').trim();
                  return (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{cleaned || <span className="text-slate-300 italic">пустая строка</span>}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setBulkLines(null); setNewTitle(bulkLines.join('\n')); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Вставить как текст</button>
                <button onClick={() => createBulkTasks(bulkLines)}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                  Создать {bulkLines.filter(l => l.replace(/^[\s\-\d.•*·]+/, '').trim()).length} задач
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Multi-select toolbar */}
        {selectedTaskIds.size > 0 && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-medium text-blue-700">Выбрано: {selectedTaskIds.size}</span>
            <button onClick={() => bulkDeleteTasks(Array.from(selectedTaskIds))}
              className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
              <Trash2 className="w-3 h-3" /> Удалить
            </button>
            <select onChange={e => { if (e.target.value) { bulkUpdateTasks(Array.from(selectedTaskIds), { priority: parseInt(e.target.value) }); e.target.value = ''; } }}
              defaultValue="" className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value="" disabled>Приоритет...</option>
              {PRIORITY_CONFIG.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select onChange={e => { if (e.target.value) { bulkUpdateTasks(Array.from(selectedTaskIds), { status: e.target.value }); e.target.value = ''; } }}
              defaultValue="" className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value="" disabled>Статус...</option>
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select onChange={e => { if (e.target.value !== '__none__') { bulkUpdateTasks(Array.from(selectedTaskIds), { projectId: e.target.value || null } as any); e.target.value = '__none__'; } }}
              defaultValue="__none__" className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value="__none__" disabled>Проект...</option>
              <option value="">Без проекта</option>
              {projects.filter(p => !p.archived).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => setSelectedTaskIds(new Set())}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700">Снять выделение</button>
          </div>
        )}

        {/* Context menu */}
        {contextMenu && (
          <div className="fixed z-[100] bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}>
            <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-100">
              {contextMenu.taskIds.length > 1 ? `${contextMenu.taskIds.length} задач` : 'Действия'}
            </div>
            <button onClick={() => bulkDeleteTasks(contextMenu.taskIds)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Удалить
            </button>
            <div className="border-t border-slate-100 my-1" />
            <div className="px-3 py-1 text-xs text-slate-400">Приоритет</div>
            {PRIORITY_CONFIG.map(p => (
              <button key={p.value} onClick={() => bulkUpdateTasks(contextMenu.taskIds, { priority: p.value })}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <Flag className={`w-3.5 h-3.5 ${p.value > 0 ? p.color : 'text-slate-300'}`} fill={p.value > 0 ? 'currentColor' : 'none'} />
                {p.label}
              </button>
            ))}
            <div className="border-t border-slate-100 my-1" />
            <div className="px-3 py-1 text-xs text-slate-400">Статус</div>
            {COLUMNS.map(c => (
              <button key={c.id} onClick={() => bulkUpdateTasks(contextMenu.taskIds, { status: c.id })}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                {c.label}
              </button>
            ))}
            <div className="border-t border-slate-100 my-1" />
            <div className="px-3 py-1 text-xs text-slate-400">Проект</div>
            <button onClick={() => bulkUpdateTasks(contextMenu.taskIds, { projectId: null } as any)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              Без проекта
            </button>
            {projects.filter(p => !p.archived).map(p => (
              <button key={p.id} onClick={() => bulkUpdateTasks(contextMenu.taskIds, { projectId: p.id })}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
            {contextMenu.taskIds.length === 1 && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { setContextMenu(null); setSelectedTaskId(contextMenu.taskIds[0]); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <AlignLeft className="w-3.5 h-3.5" /> Подробнее
                </button>
              </>
            )}
          </div>
        )}

        {/* Content area with optional right panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Task list / kanban */}
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
                selectedTaskId={selectedTaskId}
                selectedTaskIds={selectedTaskIds}
                onSelectTask={handleTaskClick}
                onContextMenu={handleContextMenu}
                createTask={createSubtask}
                sortMode={sortMode}
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
                selectedTaskId={selectedTaskId}
                onSelectTask={(id: string) => setSelectedTaskId(selectedTaskId === id ? null : id)}
              />
            )}
          </div>

          {/* Right detail panel */}
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              subtasks={subtasksMap[selectedTask.id] || []}
              projects={projects}
              columns={COLUMNS}
              updateTask={updateTask}
              deleteTask={deleteTask}
              toggleComplete={toggleComplete}
              getDueDateLabel={getDueDateLabel}
              navigate={navigate}
              onClose={() => setSelectedTaskId(null)}
              createSubtask={createSubtask}
              user={user}
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

function TaskDetailPanel({ task, subtasks, projects, columns, updateTask, deleteTask, toggleComplete, getDueDateLabel, navigate, onClose, createSubtask, user }: any) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [bulkSubtaskLines, setBulkSubtaskLines] = useState<string[] | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const lastCol = columns.length > 0 ? columns[columns.length - 1].id : 'done';
  const isDone = task.status === lastCol;
  const priority = PRIORITY_CONFIG.find((p: any) => p.value === task.priority) || PRIORITY_CONFIG[0];
  const project = projects.find((p: any) => p.id === task.projectId);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
  }, [task.id, task.title, task.description]);

  useEffect(() => {
    const loadAttachments = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/attachments?taskId=${task.id}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
        if (res.ok) {
          const data = await res.json();
          setAttachments(data.filter((a: any) => a.taskId === task.id));
        }
      } catch {}
    };
    loadAttachments();
  }, [task.id, user]);

  const uploadFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const idToken = await user.getIdToken();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('taskId', task.id);
      const res = await fetch('/api/attachments', { method: 'POST', headers: { 'Authorization': `Bearer ${idToken}` }, body: fd });
      if (res.ok) {
        const att = await res.json();
        setAttachments(prev => [att, ...prev]);
      }
    } catch {}
    setUploading(false);
  };

  const deleteAttachment = async (attId: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/attachments/${attId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${idToken}` } });
      setAttachments(prev => prev.filter(a => a.id !== attId));
    } catch {}
  };

  const downloadAttachment = async (att: any) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/attachments/${att.id}/download`, { headers: { 'Authorization': `Bearer ${idToken}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.originalName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveTitle = () => {
    if (title.trim() && title.trim() !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
  };

  const saveDescription = () => {
    if (description !== (task.description || '')) {
      updateTask(task.id, { description: description });
    }
  };

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    await createSubtask({ title: subtaskTitle.trim(), parentId: task.id, status: 'inbox' });
    setSubtaskTitle('');
  };

  const handleSubtaskPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length >= 2) {
      e.preventDefault();
      setBulkSubtaskLines(lines);
    }
  };

  const createBulkSubtasks = async (lines: string[]) => {
    for (const line of lines) {
      const t = line.replace(/^[\s\-\d.•*·]+/, '').trim();
      if (!t) continue;
      await createSubtask({ title: t, parentId: task.id, status: 'inbox' });
    }
    setBulkSubtaskLines(null);
    setSubtaskTitle('');
  };

  return (
    <div className="w-96 border-l border-slate-200 bg-white flex flex-col flex-shrink-0 overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => toggleComplete(task)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}>
            {isDone && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-xs text-slate-400 font-medium">
            {columns.find((c: TaskColumn) => c.id === task.status)?.label || task.status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {task.dealId && (
            <button onClick={() => navigate(`/deal/${task.dealId}`)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="Связанная сделка">
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={async () => {
              if (!user) return;
              try {
                const idToken = await user.getIdToken();
                const dueText = task.dueDate ? ` (срок: ${task.dueDate})` : '';
                const prioText = task.priority > 0 ? ` [${PRIORITY_CONFIG[task.priority]?.label}]` : '';
                const text = `📋 <b>${task.title}</b>${prioText}${dueText}${task.description ? '\n' + task.description : ''}`;
                const res = await fetch('/api/telegram/notify', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text }),
                });
                const data = await res.json();
                if (data.success) alert('Отправлено в Telegram!');
                else alert('Ошибка: ' + (data.error || 'Telegram не настроен'));
              } catch { alert('Ошибка соединения'); }
            }}
            className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors"
            title="Отправить в Telegram"
          >
            <Send className="w-4 h-4" />
          </button>
          <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="px-5 pt-4 pb-2">
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') { saveTitle(); (e.target as HTMLInputElement).blur(); } }}
            className={`w-full text-lg font-bold border-none outline-none bg-transparent resize-none ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}
          />
        </div>

        {/* Properties */}
        <div className="px-5 py-3 space-y-3">
          {/* Due date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-500 w-20 flex-shrink-0">Когда</span>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={e => updateTask(task.id, { dueDate: e.target.value || null } as any)}
                className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:border-blue-400 flex-1"
              />
              {task.dueDate && (() => {
                const dl = getDueDateLabel(task.dueDate);
                return <span className={`text-xs px-2 py-0.5 rounded ${dl.className}`}>{dl.text}</span>;
              })()}
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <Flag className={`w-4 h-4 flex-shrink-0 ${task.priority > 0 ? priority.color : 'text-slate-400'}`} fill={task.priority > 0 ? 'currentColor' : 'none'} />
            <span className="text-sm text-slate-500 w-20 flex-shrink-0">Приоритет</span>
            <select
              value={task.priority}
              onChange={e => updateTask(task.id, { priority: parseInt(e.target.value) })}
              className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:border-blue-400 flex-1"
            >
              {PRIORITY_CONFIG.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <ListTodo className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-500 w-20 flex-shrink-0">Статус</span>
            <select
              value={task.status}
              onChange={e => {
                const isLast = columns.length > 0 && e.target.value === columns[columns.length - 1].id;
                updateTask(task.id, { status: e.target.value, completedAt: isLast ? new Date().toISOString() as any : null });
              }}
              className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:border-blue-400 flex-1"
            >
              {columns.map((c: TaskColumn) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Project */}
          <div className="flex items-center gap-3">
            <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-500 w-20 flex-shrink-0">Проект</span>
            <select
              value={task.projectId || ''}
              onChange={e => updateTask(task.id, { projectId: e.target.value || null } as any)}
              className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:border-blue-400 flex-1"
            >
              <option value="">Без проекта</option>
              {projects.filter((p: any) => !p.archived).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-slate-100" />

        {/* Description */}
        <div className="px-5 py-4">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={saveDescription}
            rows={4}
            placeholder="Описание задачи..."
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-y bg-slate-50"
          />
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-slate-100" />

        {/* Subtasks */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Подзадачи</span>
            <button onClick={() => { setAddingSubtask(true); setSubtaskTitle(''); }}
              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>

          {subtasks.length === 0 && !addingSubtask && (
            <p className="text-xs text-slate-400 py-2">Нет подзадач</p>
          )}

          <div className="space-y-1">
            {subtasks.map((sub: Task) => {
              const subDone = sub.status === lastCol;
              const subPriority = PRIORITY_CONFIG.find(p => p.value === sub.priority) || PRIORITY_CONFIG[0];
              return (
                <div key={sub.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50 group">
                  <button onClick={() => toggleComplete(sub)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${subDone ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}>
                    {subDone && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${subDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                  {sub.priority > 0 && <Flag className={`w-3 h-3 ${subPriority.color}`} fill="currentColor" />}
                  <button onClick={() => deleteTask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {addingSubtask && (
              <div className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                <input
                  autoFocus
                  value={subtaskTitle}
                  onChange={e => setSubtaskTitle(e.target.value)}
                  onPaste={handleSubtaskPaste}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); if (e.key === 'Escape') setAddingSubtask(false); }}
                  placeholder="Новая подзадача..."
                  className="flex-1 text-sm border-none outline-none bg-transparent"
                />
              </div>
            )}

            {bulkSubtaskLines && (
              <div className="mt-2 border border-blue-200 rounded-lg p-3 bg-blue-50">
                <p className="text-xs font-medium text-blue-700 mb-2">Добавить {bulkSubtaskLines.filter(l => l.replace(/^[\s\-\d.•*·]+/, '').trim()).length} подзадач:</p>
                <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                  {bulkSubtaskLines.map((line, i) => {
                    const cleaned = line.replace(/^[\s\-\d.•*·]+/, '').trim();
                    return cleaned ? (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" />
                        {cleaned}
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => createBulkSubtasks(bulkSubtaskLines)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium">Добавить все</button>
                  <button onClick={() => setBulkSubtaskLines(null)}
                    className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-md">Отмена</button>
                </div>
              </div>
            )}
          </div>

          {subtasks.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all"
                  style={{ width: `${(subtasks.filter((s: Task) => s.status === lastCol).length / subtasks.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">
                {subtasks.filter((s: Task) => s.status === lastCol).length}/{subtasks.length}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-slate-100" />

        {/* Attachments */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Файлы
              {attachments.length > 0 && <span className="text-xs text-slate-400">({attachments.length})</span>}
            </span>
            <button onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium">
              <Upload className="w-3.5 h-3.5" /> Загрузить
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); e.target.value = ''; }} />

          {uploading && <p className="text-xs text-blue-500 py-1">Загрузка...</p>}

          {attachments.length === 0 && !uploading && (
            <p className="text-xs text-slate-400 py-2">Нет файлов</p>
          )}

          <div className="space-y-1">
            {attachments.map((att: any) => (
              <div key={att.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50 group">
                <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="flex-1 text-xs text-slate-700 truncate">{att.originalName}</span>
                <span className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => downloadAttachment(att)} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-500" title="Скачать">
                  <Download className="w-3 h-3" />
                </button>
                <button onClick={() => deleteAttachment(att.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-500" title="Удалить">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListView({ tasks, subtasksMap, projects, columns, expandedTasks, setExpandedTasks, updateTask, deleteTask, toggleComplete, getDueDateLabel, navigate, selectedTaskId, selectedTaskIds, onSelectTask, onContextMenu, createTask, sortMode }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const lastCol = columns.length > 0 ? columns[columns.length - 1].id : 'done';

  const handleListDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('listTaskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDragId(taskId);
  };

  const handleListDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(taskId);
  };

  const handleListDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('listTaskId');
    setDragId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const sourceIdx = tasks.findIndex((t: any) => t.id === sourceId);
    const targetIdx = tasks.findIndex((t: any) => t.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((t: any, i: number) => {
      updateTask(t.id, { order: i });
    });
  };

  const handleListDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

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
    const isSelected = selectedTaskId === task.id;
    const isMultiSelected = selectedTaskIds?.has(task.id);

    return (
      <div key={task.id}>
        <div
          onClick={(e) => onSelectTask(task.id, e)}
          onContextMenu={!isSubtask ? (e: React.MouseEvent) => onContextMenu(e, task.id) : undefined}
          draggable={!isSubtask && sortMode === 'manual'}
          onDragStart={!isSubtask ? (e) => handleListDragStart(e, task.id) : undefined}
          onDragOver={!isSubtask ? (e) => handleListDragOver(e, task.id) : undefined}
          onDrop={!isSubtask ? (e) => handleListDrop(e, task.id) : undefined}
          onDragEnd={!isSubtask ? handleListDragEnd : undefined}
          className={`group flex items-center gap-2 px-6 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${isSubtask ? 'pl-14' : ''} ${isDone ? 'opacity-60' : ''} ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''} ${isMultiSelected ? 'bg-blue-50/70' : ''} ${dragId === task.id ? 'opacity-40' : ''} ${dragOverId === task.id && dragId !== task.id ? 'border-t-2 border-t-blue-400' : ''}`}
        >
          {!isSubtask && isMultiSelected && (
            <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
          {!isSubtask && !isMultiSelected && selectedTaskIds?.size > 0 && (
            <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
          )}

          {!isSubtask && sortMode === 'manual' && !(selectedTaskIds?.size > 0) && (
            <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />
          )}

          {!isSubtask && hasSubtasks && (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }} className="p-0.5 text-slate-400 hover:text-slate-600">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          {!isSubtask && !hasSubtasks && <div className="w-4.5" />}

          <button onClick={(e) => { e.stopPropagation(); toggleComplete(task); }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}>
            {isDone && <Check className="w-3 h-3 text-white" />}
          </button>

          {editingId === task.id ? (
            <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null); }}
              onBlur={() => saveEdit(task.id)}
              className="flex-1 px-2 py-0.5 text-sm border border-blue-300 rounded focus:outline-none" />
          ) : (
            <span onDoubleClick={(e) => { e.stopPropagation(); startEdit(task); }}
              className={`flex-1 text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.title}
              {task.description && <AlignLeft className="w-3 h-3 inline ml-1.5 text-slate-300" />}
            </span>
          )}

          {hasSubtasks && !isSubtask && (
            <span className="text-xs text-slate-400">{completedSubs}/{subs.length}</span>
          )}

          {task.dealId && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/deal/${task.dealId}`); }} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5" title="Связанная сделка">
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

          {!isSubtask && (
            <button onClick={(e) => { e.stopPropagation(); setAddingSubtask(task.id); setSubtaskTitle(''); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-blue-500" title="Добавить подзадачу">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
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

function KanbanView({ tasks, columns, updateTask, handleDragStart, handleDrop, toggleComplete, getDueDateLabel, projects, navigate, selectedTaskId, onSelectTask }: any) {
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
                const isSelected = selectedTaskId === task.id;

                return (
                  <div key={task.id} draggable onDragStart={e => handleDragStart(e, task.id)}
                    onClick={() => onSelectTask(task.id)}
                    className={`bg-white p-3 rounded-lg border shadow-sm hover:shadow hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200'}`}>
                    <div className="flex items-start gap-2 mb-1">
                      <button onClick={(e) => { e.stopPropagation(); toggleComplete(task); }}
                        className={`w-4.5 h-4.5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}>
                        {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <span className={`text-sm font-medium flex-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </span>
                      {task.priority > 0 && <Flag className={`w-3.5 h-3.5 flex-shrink-0 ${priority.color}`} fill="currentColor" />}
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {project && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>
                      )}
                      {task.dueDate && (() => {
                        const dl = getDueDateLabel(task.dueDate);
                        return <span className={`text-[10px] px-1.5 py-0.5 rounded ${dl.className}`}><Calendar className="w-2.5 h-2.5 inline mr-0.5" />{dl.text}</span>;
                      })()}
                      {task.dealId && (
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/deal/${task.dealId}`); }}
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
