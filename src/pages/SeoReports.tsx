import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, BarChart3, Globe, TrendingUp, TrendingDown, Search,
  Eye, ArrowUpRight, ArrowDownRight, FileText, RefreshCw,
  Link2, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Loader2, Unlink, GripVertical, Pencil, X, Check
} from 'lucide-react';

type Tab = 'reports' | 'connections';

interface Connection {
  id: string;
  service: string;
  siteUrl?: string;
  accessToken?: string;
  hostId?: string;
  counterId?: string;
  projectId?: string;
}

interface Report {
  id: string;
  title: string;
  projectId?: string;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  status: string;
  data?: any;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  archived?: boolean;
}

export default function SeoReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const [wmToken, setWmToken] = useState('');
  const [mcToken, setMcToken] = useState('');
  const [wmHosts, setWmHosts] = useState<any[]>([]);
  const [mcCounters, setMcCounters] = useState<any[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [loadingCounters, setLoadingCounters] = useState(false);
  const [connectingWm, setConnectingWm] = useState(false);
  const [connectingMc, setConnectingMc] = useState(false);

  const [newReport, setNewReport] = useState({ title: '', projectId: '', dateFrom: '', dateTo: '' });
  const [showNewReport, setShowNewReport] = useState(false);

  const getToken = useCallback(async () => user ? await user.getIdToken() : '', [user]);

  const fetchAll = useCallback(async () => {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const [connRes, repRes, projRes] = await Promise.all([
      fetch('/api/seo-connections', { headers }),
      fetch('/api/seo-reports', { headers }),
      fetch('/api/projects', { headers }),
    ]);
    if (connRes.ok) setConnections(await connRes.json());
    if (repRes.ok) setReports(await repRes.json());
    if (projRes.ok) setProjects(await projRes.json());
    setLoading(false);
  }, [getToken]);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const wmConn = connections.find(c => c.service === 'yandex_webmaster');
  const mcConn = connections.find(c => c.service === 'yandex_metrica');

  const connectByToken = async (service: 'yandex_webmaster' | 'yandex_metrica', accessToken: string) => {
    const token = await getToken();
    const res = await fetch('/api/seo-connections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, accessToken }),
    });
    if (res.ok) {
      await fetchAll();
      if (service === 'yandex_webmaster') setWmToken('');
      if (service === 'yandex_metrica') setMcToken('');
    }
  };

  const loadWmHosts = async () => {
    setLoadingHosts(true);
    const token = await getToken();
    const res = await fetch('/api/yandex/webmaster/hosts', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setWmHosts(data.hosts || []);
    }
    setLoadingHosts(false);
  };

  const loadMcCounters = async () => {
    setLoadingCounters(true);
    const token = await getToken();
    const res = await fetch('/api/yandex/metrica/counters', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMcCounters(data.counters || []);
    }
    setLoadingCounters(false);
  };

  useEffect(() => {
    if (wmConn && wmHosts.length === 0 && !loadingHosts) loadWmHosts();
  }, [wmConn]);

  useEffect(() => {
    if (mcConn && mcCounters.length === 0 && !loadingCounters) loadMcCounters();
  }, [mcConn]);

  const assignToProject = async (hostOrCounterId: string, projectId: string, type: 'webmaster' | 'metrica') => {
    const token = await getToken();
    const conn = type === 'webmaster' ? wmConn : mcConn;
    if (!conn) return;

    const existing = connections.find(c =>
      c.service === (type === 'webmaster' ? 'yandex_webmaster' : 'yandex_metrica') &&
      c.projectId === projectId
    );
    if (existing && existing.id !== conn.id) {
      await fetch(`/api/seo-connections/${existing.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: null, [type === 'webmaster' ? 'hostId' : 'counterId']: null }),
      });
    }

    const connForSite = connections.find(c =>
      c.service === conn.service &&
      (type === 'webmaster' ? c.hostId === hostOrCounterId : c.counterId === hostOrCounterId)
    );

    if (connForSite) {
      await fetch(`/api/seo-connections/${connForSite.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
    } else {
      await fetch('/api/seo-connections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: type === 'webmaster' ? 'yandex_webmaster' : 'yandex_metrica',
          [type === 'webmaster' ? 'hostId' : 'counterId']: hostOrCounterId,
          projectId,
        }),
      });
    }
    await fetchAll();
  };

  const saveProjectBinding = async (connId: string, field: string, value: string) => {
    const token = await getToken();
    await fetch(`/api/seo-connections/${connId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value || null }),
    });
    await fetchAll();
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Отключить сервис?')) return;
    const token = await getToken();
    await fetch(`/api/seo-connections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (connections.find(c => c.id === id)?.service === 'yandex_webmaster') setWmHosts([]);
    if (connections.find(c => c.id === id)?.service === 'yandex_metrica') setMcCounters([]);
    await fetchAll();
  };

  const createReport = async () => {
    const token = await getToken();
    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const project = projects.find(p => p.id === newReport.projectId);
    const res = await fetch('/api/seo-reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newReport.title || `SEO: ${project?.name || 'Отчёт'} ${today}`,
        projectId: newReport.projectId || null,
        dateFrom: newReport.dateFrom || monthAgo,
        dateTo: newReport.dateTo || today,
      }),
    });
    if (res.ok) {
      setShowNewReport(false);
      setNewReport({ title: '', projectId: '', dateFrom: '', dateTo: '' });
      await fetchAll();
    }
  };

  const generateReport = async (id: string) => {
    setGenerating(id);
    const token = await getToken();
    await fetch(`/api/seo-reports/${id}/generate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    await fetchAll();
    const repRes = await fetch(`/api/seo-reports/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (repRes.ok) {
      const r = await repRes.json();
      setViewReport(r);
      setReports(prev => prev.map(p => p.id === id ? r : p));
    }
    setGenerating(null);
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Удалить отчёт?')) return;
    const token = await getToken();
    await fetch(`/api/seo-reports/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (viewReport?.id === id) setViewReport(null);
    await fetchAll();
  };

  const updateReportData = async (id: string, data: any) => {
    const token = await getToken();
    await fetch(`/api/seo-reports/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );

  if (viewReport) {
    return <ReportView
      report={viewReport}
      projects={projects}
      onBack={() => setViewReport(null)}
      onRegenerate={() => generateReport(viewReport.id)}
      generating={generating === viewReport.id}
      onUpdateData={(data) => {
        setViewReport({ ...viewReport, data });
        updateReportData(viewReport.id, data);
      }}
    />;
  }

  const activeProjects = projects.filter(p => !p.archived);

  const getProjectBindings = (projectId: string) => {
    const wmBind = connections.find(c => c.service === 'yandex_webmaster' && c.projectId === projectId);
    const mcBind = connections.find(c => c.service === 'yandex_metrica' && c.projectId === projectId);
    return { wmBind, mcBind };
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tasks')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">SEO Отчёты</h1>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          {([
            { id: 'connections' as Tab, label: 'Подключения и проекты', icon: Link2 },
            { id: 'reports' as Tab, label: 'Отчёты', icon: FileText },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'connections' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Шаг 1 — Подключите токены</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-slate-800 text-sm">Вебмастер</span>
                    </div>
                    {wmConn ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Подключено
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Нет
                      </span>
                    )}
                  </div>
                  {!wmConn ? (
                    <div className="space-y-2">
                      <input value={wmToken} onChange={e => setWmToken(e.target.value)} placeholder="OAuth-токен Вебмастера"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      <button onClick={() => { setConnectingWm(true); connectByToken('yandex_webmaster', wmToken).finally(() => setConnectingWm(false)); }}
                        disabled={!wmToken || connectingWm}
                        className="w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">
                        {connectingWm ? 'Подключение...' : 'Подключить'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">Сайтов загружено: <strong>{wmHosts.length}</strong></p>
                      <div className="flex gap-2">
                        <button onClick={loadWmHosts} disabled={loadingHosts} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                          <RefreshCw className={`w-3 h-3 ${loadingHosts ? 'animate-spin' : ''}`} /> Обновить
                        </button>
                        <button onClick={() => deleteConnection(wmConn.id)} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
                          <Unlink className="w-3 h-3" /> Отключить
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-slate-800 text-sm">Метрика</span>
                    </div>
                    {mcConn ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Подключено
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Нет
                      </span>
                    )}
                  </div>
                  {!mcConn ? (
                    <div className="space-y-2">
                      <input value={mcToken} onChange={e => setMcToken(e.target.value)} placeholder="OAuth-токен Метрики"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      <button onClick={() => { setConnectingMc(true); connectByToken('yandex_metrica', mcToken).finally(() => setConnectingMc(false)); }}
                        disabled={!mcToken || connectingMc}
                        className="w-full py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50">
                        {connectingMc ? 'Подключение...' : 'Подключить'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">Счётчиков загружено: <strong>{mcCounters.length}</strong></p>
                      <div className="flex gap-2">
                        <button onClick={loadMcCounters} disabled={loadingCounters} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                          <RefreshCw className={`w-3 h-3 ${loadingCounters ? 'animate-spin' : ''}`} /> Обновить
                        </button>
                        <button onClick={() => deleteConnection(mcConn.id)} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
                          <Unlink className="w-3 h-3" /> Отключить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!wmConn && !mcConn && (
                <p className="text-xs text-slate-400 mt-3">
                  Получите токен в <a href="https://oauth.yandex.ru" target="_blank" rel="noopener" className="text-blue-500 hover:underline">oauth.yandex.ru</a> — ваше приложение — отладочный токен. Можно использовать один токен для обоих сервисов.
                </p>
              )}
            </div>

            {(wmConn || mcConn) && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Шаг 2 — Привяжите сайты к проектам</h2>
                <p className="text-xs text-slate-400 mb-4">Для каждого проекта выберите сайт из Вебмастера и/или счётчик из Метрики.</p>

                {activeProjects.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm mb-1">Нет проектов</p>
                    <p className="text-xs">Создайте проект в разделе Задачи</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.map(project => {
                      const { wmBind, mcBind } = getProjectBindings(project.id);
                      return (
                        <div key={project.id} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                            <span className="font-semibold text-slate-800 text-sm">{project.name}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {wmConn && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                  <Globe className="w-3 h-3 inline mr-1" />Сайт (Вебмастер)
                                </label>
                                <select
                                  value={wmBind?.hostId || ''}
                                  onChange={e => {
                                    if (e.target.value) assignToProject(e.target.value, project.id, 'webmaster');
                                    else if (wmBind) saveProjectBinding(wmBind.id, 'projectId', '');
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                                >
                                  <option value="">— не выбран —</option>
                                  {wmHosts.map((h: any) => (
                                    <option key={h.host_id} value={h.host_id}>{h.host_id}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {mcConn && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                  <BarChart3 className="w-3 h-3 inline mr-1" />Счётчик (Метрика)
                                </label>
                                <select
                                  value={mcBind?.counterId || ''}
                                  onChange={e => {
                                    if (e.target.value) assignToProject(e.target.value, project.id, 'metrica');
                                    else if (mcBind) saveProjectBinding(mcBind.id, 'projectId', '');
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                                >
                                  <option value="">— не выбран —</option>
                                  {mcCounters.map((c: any) => (
                                    <option key={c.id} value={String(c.id)}>{c.name} — {c.site}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {connections.length === 0
                  ? 'Сначала подключите токены во вкладке "Подключения и проекты"'
                  : `Подключено сервисов: ${connections.filter(c => !c.projectId || c.hostId || c.counterId).length}`}
              </p>
              <button onClick={() => setShowNewReport(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600">
                <Plus className="w-4 h-4" /> Новый отчёт
              </button>
            </div>

            {showNewReport && (
              <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/50">
                <h3 className="font-bold text-slate-800 mb-3">Новый SEO отчёт</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Проект</label>
                    <select value={newReport.projectId} onChange={e => setNewReport({ ...newReport, projectId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                      <option value="">Выберите проект</option>
                      {activeProjects.map(p => {
                        const { wmBind, mcBind } = getProjectBindings(p.id);
                        const hasBind = wmBind?.hostId || mcBind?.counterId;
                        return <option key={p.id} value={p.id}>{p.name} {hasBind ? '' : '(нет привязок)'}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Название (необязательно)</label>
                    <input value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                      placeholder="Автоматически по проекту"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">От</label>
                      <input type="date" value={newReport.dateFrom} onChange={e => setNewReport({ ...newReport, dateFrom: e.target.value })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">До</label>
                      <input type="date" value={newReport.dateTo} onChange={e => setNewReport({ ...newReport, dateTo: e.target.value })}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={createReport} disabled={!newReport.projectId}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50">Создать и собрать данные</button>
                  <button onClick={() => setShowNewReport(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Отмена</button>
                </div>
              </div>
            )}

            {reports.length === 0 && !showNewReport ? (
              <div className="text-center py-16 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="mb-2">Нет отчётов</p>
                <p className="text-sm">Привяжите сайты к проектам и создайте первый отчёт</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map(r => {
                  const project = projects.find(p => p.id === r.projectId);
                  return (
                    <div key={r.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${r.status === 'ready' ? 'bg-green-500' : r.status === 'generating' ? 'bg-amber-500 animate-pulse' : r.status === 'error' ? 'bg-red-500' : 'bg-slate-300'}`} />
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">{r.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {project && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>}
                              {r.dateFrom && r.dateTo && <span className="text-xs text-slate-400">{r.dateFrom} — {r.dateTo}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.status === 'ready' && (
                            <button onClick={() => setViewReport(r)} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> Просмотр
                            </button>
                          )}
                          <button onClick={() => generateReport(r.id)} disabled={generating === r.id}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                            {generating === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            {generating === r.id ? 'Сбор...' : r.status === 'ready' ? 'Обновить' : 'Собрать данные'}
                          </button>
                          <button onClick={() => deleteReport(r.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Delta helpers ---
function delta(curr: number, prev: number): { value: number; pct: number; positive: boolean } {
  const d = curr - prev;
  const pct = prev > 0 ? Math.round((d / prev) * 100) : curr > 0 ? 100 : 0;
  return { value: d, pct, positive: d >= 0 };
}

function DeltaBadge({ curr, prev, invert, suffix = '' }: { curr: number; prev: number; invert?: boolean; suffix?: string }) {
  if (prev === 0 && curr === 0) return null;
  const d = delta(curr, prev);
  const isGood = invert ? !d.positive : d.positive;
  if (d.value === 0) return <span className="text-[11px] text-slate-400 ml-1">0%</span>;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ml-1.5 ${isGood ? 'text-green-600' : 'text-red-500'}`}>
      {d.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {d.positive ? '+' : ''}{d.pct}%{suffix}
    </span>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Report View ---
function ReportView({ report, projects, onBack, onRegenerate, generating, onUpdateData }: {
  report: Report; projects: Project[]; onBack: () => void; onRegenerate: () => void;
  generating: boolean; onUpdateData: (data: any) => void;
}) {
  const d = report.data || {};
  const wm = d.webmaster;
  const mc = d.metrica;
  const pwm = d.prevWebmaster;
  const pmc = d.prevMetrica;
  const tasks = d.tasks || [];
  const project = projects.find(p => p.id === report.projectId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set(['overview', 'queries', 'traffic', 'sources', 'pages', 'tasks', 'indexing', 'search-engines']));
  const toggle = (s: string) => {
    const next = new Set(expanded);
    if (next.has(s)) next.delete(s); else next.add(s);
    setExpanded(next);
  };

  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newTask, setNewTask] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  const updateTasks = (newTasks: any[]) => {
    onUpdateData({ ...d, tasks: newTasks });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    updateTasks([...tasks, { title: newTask.trim(), status: 'todo', done: false }]);
    setNewTask('');
    taskInputRef.current?.focus();
  };

  const removeTask = (i: number) => {
    updateTasks(tasks.filter((_: any, idx: number) => idx !== i));
  };

  const toggleTask = (i: number) => {
    const updated = tasks.map((t: any, idx: number) =>
      idx === i ? { ...t, done: !t.done, status: t.done ? 'todo' : 'done', completedAt: t.done ? null : new Date().toISOString() } : t
    );
    updateTasks(updated);
  };

  const startEdit = (i: number) => {
    setEditingTask(i);
    setEditText(tasks[i].title);
  };

  const saveEdit = () => {
    if (editingTask === null) return;
    if (editText.trim()) {
      const updated = tasks.map((t: any, idx: number) =>
        idx === editingTask ? { ...t, title: editText.trim() } : t
      );
      updateTasks(updated);
    }
    setEditingTask(null);
  };

  const Section = ({ id, title, icon: Icon, count, children }: { id: string; title: string; icon: any; count?: number; children: React.ReactNode }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => toggle(id)} className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-slate-50 transition-colors">
        {expanded.has(id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {count !== undefined && <span className="text-xs text-slate-400 ml-1">({count})</span>}
      </button>
      {expanded.has(id) && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );

  const StatCard = ({ label, value, prev: prevVal, color = 'blue', invert, suffix = '' }: {
    label: string; value: number; prev?: number; color?: string; invert?: boolean; suffix?: string;
  }) => {
    const bgColors: Record<string, string> = {
      blue: 'bg-blue-50', sky: 'bg-sky-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50',
      purple: 'bg-purple-50', indigo: 'bg-indigo-50', teal: 'bg-teal-50', rose: 'bg-rose-50',
      green: 'bg-green-50', red: 'bg-red-50',
    };
    const formatted = suffix === '%' ? `${value}%` : suffix === 'с' ? formatDuration(value) : value.toLocaleString('ru');
    return (
      <div className={`${bgColors[color] || 'bg-slate-50'} rounded-xl p-4`}>
        <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline">
          <p className="text-2xl font-bold text-slate-800">{formatted}</p>
          {prevVal !== undefined && <DeltaBadge curr={value} prev={prevVal} invert={invert} />}
        </div>
        {prevVal !== undefined && prevVal > 0 && (
          <p className="text-[11px] text-slate-400 mt-1">
            Пред. период: {suffix === '%' ? `${prevVal}%` : suffix === 'с' ? formatDuration(prevVal) : prevVal.toLocaleString('ru')}
          </p>
        )}
      </div>
    );
  };

  const periodLabel = d.dateFrom && d.dateTo
    ? `${d.dateFrom} — ${d.dateTo}`
    : report.dateFrom && report.dateTo
      ? `${report.dateFrom} — ${report.dateTo}`
      : '';

  const prevPeriodLabel = d.prevDateFrom && d.prevDateTo ? `${d.prevDateFrom} — ${d.prevDateTo}` : '';

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {project && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>}
                {periodLabel && <span className="text-xs text-slate-500">{periodLabel}</span>}
                {prevPeriodLabel && <span className="text-xs text-slate-400">vs {prevPeriodLabel}</span>}
                {d.generatedAt && <span className="text-xs text-slate-400">{new Date(d.generatedAt).toLocaleString('ru')}</span>}
              </div>
            </div>
          </div>
          <button onClick={onRegenerate} disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? 'Обновление...' : 'Обновить данные'}
          </button>
        </div>

        <div className="space-y-4">
          {/* Overview with comparison */}
          {(wm || mc) && (
            <Section id="overview" title="Обзор" icon={TrendingUp}>
              {wm && (
                <>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Яндекс Вебмастер</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <StatCard label="Клики" value={wm.totalClicks || 0} prev={pwm?.totalClicks} color="blue" />
                    <StatCard label="Показы" value={wm.totalImpressions || 0} prev={pwm?.totalImpressions} color="sky" />
                    <StatCard label="CTR" value={wm.avgCtr || 0} prev={pwm?.avgCtr} color="emerald" suffix="%" />
                    <StatCard label="Ср. позиция" value={wm.avgPosition || 0} prev={pwm?.avgPosition} color="amber" invert />
                  </div>
                </>
              )}
              {mc && (
                <>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Яндекс Метрика</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Визиты" value={mc.visits || 0} prev={pmc?.visits} color="purple" />
                    <StatCard label="Просмотры" value={mc.pageviews || 0} prev={pmc?.pageviews} color="indigo" />
                    <StatCard label="Посетители" value={mc.users || 0} prev={pmc?.users} color="teal" />
                    <StatCard label="Отказы" value={mc.bounceRate || 0} prev={pmc?.bounceRate} color="rose" suffix="%" invert />
                  </div>
                  {mc.avgDuration !== undefined && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatCard label="Ср. время на сайте" value={mc.avgDuration || 0} prev={pmc?.avgDuration} color="blue" suffix="с" />
                    </div>
                  )}
                </>
              )}
            </Section>
          )}

          {/* Indexing */}
          {wm?.indexing && (
            <Section id="indexing" title="Индексация" icon={Globe}>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="В поиске" value={wm.indexing.indexed} prev={pwm?.indexing?.indexed} color="green" />
                <StatCard label="Исключено" value={wm.indexing.excluded} prev={pwm?.indexing?.excluded} color="red" invert />
              </div>
            </Section>
          )}

          {/* Queries table */}
          {wm?.queries && wm.queries.length > 0 && (
            <Section id="queries" title="Топ поисковых запросов" icon={Search} count={wm.queries.length}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 pr-3 w-8">#</th>
                      <th className="pb-2 pr-3">Запрос</th>
                      <th className="pb-2 pr-3 text-right">Клики</th>
                      <th className="pb-2 pr-3 text-right">Показы</th>
                      <th className="pb-2 pr-3 text-right">CTR</th>
                      <th className="pb-2 text-right">Позиция</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wm.queries.map((q: any, i: number) => {
                      const prevQ = pwm?.queries?.find((pq: any) => pq.query === q.query);
                      return (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2.5 pr-3 text-xs text-slate-400">{i + 1}</td>
                          <td className="py-2.5 pr-3 text-slate-700 max-w-[280px] truncate font-medium">{q.query}</td>
                          <td className="py-2.5 pr-3 text-right">
                            <span className="font-medium">{q.clicks}</span>
                            {prevQ && <DeltaBadge curr={q.clicks} prev={prevQ.clicks} />}
                          </td>
                          <td className="py-2.5 pr-3 text-right text-slate-500">{q.impressions}</td>
                          <td className="py-2.5 pr-3 text-right text-slate-500">{q.ctr}%</td>
                          <td className="py-2.5 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${q.position <= 3 ? 'bg-green-100 text-green-700' : q.position <= 10 ? 'bg-blue-100 text-blue-700' : q.position <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                              {q.position}
                            </span>
                            {prevQ && prevQ.position !== q.position && (
                              <span className={`text-[10px] ml-1 ${q.position < prevQ.position ? 'text-green-600' : 'text-red-500'}`}>
                                {q.position < prevQ.position ? `+${Math.round(prevQ.position - q.position)}` : `-${Math.round(q.position - prevQ.position)}`}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Traffic sources */}
          {mc?.sources && mc.sources.length > 0 && (
            <Section id="sources" title="Источники трафика" icon={ArrowUpRight} count={mc.sources.length}>
              <div className="space-y-2.5">
                {mc.sources.map((s: any, i: number) => {
                  const prevS = pmc?.sources?.find((ps: any) => ps.name === s.name);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 w-36 truncate font-medium">{s.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                        {prevS && prevS.percentage > 0 && (
                          <div className="absolute h-full bg-slate-200 rounded-full" style={{ width: `${Math.max(prevS.percentage, 3)}%` }} />
                        )}
                        <div className="relative h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 text-[10px] text-white font-medium transition-all"
                          style={{ width: `${Math.max(s.percentage, 3)}%` }}>
                          {s.percentage > 8 ? `${s.percentage}%` : ''}
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-sm font-medium text-slate-700">{s.visits.toLocaleString('ru')}</span>
                        {prevS && <DeltaBadge curr={s.visits} prev={prevS.visits} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Search engines */}
          {mc?.searchEngines && mc.searchEngines.length > 0 && (
            <Section id="search-engines" title="Поисковые системы" icon={Search} count={mc.searchEngines.length}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mc.searchEngines.map((se: any, i: number) => {
                  const prevSE = pmc?.searchEngines?.find((pse: any) => pse.name === se.name);
                  return (
                    <div key={i} className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-slate-600 mb-1">{se.name}</p>
                      <div className="flex items-baseline">
                        <p className="text-xl font-bold text-slate-800">{se.visits.toLocaleString('ru')}</p>
                        {prevSE && <DeltaBadge curr={se.visits} prev={prevSE.visits} />}
                      </div>
                      {prevSE && prevSE.visits > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Было: {prevSE.visits.toLocaleString('ru')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Top pages */}
          {mc?.topPages && mc.topPages.length > 0 && (
            <Section id="pages" title="Топ страниц" icon={FileText} count={mc.topPages.length}>
              <div className="space-y-1">
                {mc.topPages.map((p: any, i: number) => {
                  const prevP = pmc?.topPages?.find((pp: any) => pp.url === p.url);
                  return (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-400 w-6 text-right">{i + 1}.</span>
                      <span className="flex-1 text-slate-700 truncate text-xs">{p.url}</span>
                      <span className="text-sm text-slate-700 font-medium">{p.views.toLocaleString('ru')}</span>
                      {prevP && <DeltaBadge curr={p.views} prev={prevP.views} />}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Editable tasks */}
          <Section id="tasks" title="Выполненные работы" icon={CheckCircle2} count={tasks.length}>
            <div className="space-y-1 mb-3">
              {tasks.length === 0 && (
                <p className="text-sm text-slate-400 py-2">Нет задач. Добавьте вручную или нажмите "Обновить данные" для загрузки из проекта.</p>
              )}
              {tasks.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-1.5 group">
                  <button onClick={() => toggleTask(i)}
                    className={`w-4 h-4 rounded-[3px] border-2 flex-shrink-0 flex items-center justify-center transition-colors ${t.done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}>
                    {t.done && <span className="text-white text-[10px]">&#10003;</span>}
                  </button>
                  {editingTask === i ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input value={editText} onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingTask(null); }}
                        className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none" autoFocus />
                      <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingTask(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <>
                      <span className={`flex-1 text-sm ${t.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.title}</span>
                      {t.completedAt && <span className="text-[11px] text-slate-400">{new Date(t.completedAt).toLocaleDateString('ru')}</span>}
                      <button onClick={() => startEdit(i)} className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeTask(i)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input ref={taskInputRef} value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
                placeholder="Добавить работу..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400" />
              <button onClick={addTask} disabled={!newTask.trim()}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Section>

          {!wm && !mc && tasks.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="mb-2">Нет данных</p>
              <p className="text-sm">Привяжите сайт/счётчик к проекту и нажмите "Обновить данные"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
