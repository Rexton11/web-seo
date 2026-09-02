import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, BarChart3, Globe, TrendingUp, Search,
  Eye, ArrowUpRight, ArrowDownRight, FileText, RefreshCw,
  Link2, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Loader2, Unlink, Pencil, X, Check, Printer, Monitor, Smartphone,
  Tablet, MapPin, Download
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
  const [gscToken, setGscToken] = useState('');
  const [gscOAuthLoading, setGscOAuthLoading] = useState(false);
  const [wmHosts, setWmHosts] = useState<any[]>([]);
  const [mcCounters, setMcCounters] = useState<any[]>([]);
  const [gscSites, setGscSites] = useState<any[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [loadingCounters, setLoadingCounters] = useState(false);
  const [loadingGscSites, setLoadingGscSites] = useState(false);
  const [connectingWm, setConnectingWm] = useState(false);
  const [connectingMc, setConnectingMc] = useState(false);
  const [connectingGsc, setConnectingGsc] = useState(false);

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
  const gscConn = connections.find(c => c.service === 'google_search_console');

  const connectByToken = async (service: string, accessToken: string, siteUrl?: string) => {
    const token = await getToken();
    const res = await fetch('/api/seo-connections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, accessToken, siteUrl }),
    });
    if (res.ok) {
      await fetchAll();
      if (service === 'yandex_webmaster') setWmToken('');
      if (service === 'yandex_metrica') setMcToken('');
      if (service === 'google_search_console') setGscToken('');
    }
  };

  const loadWmHosts = async () => {
    setLoadingHosts(true);
    const token = await getToken();
    const res = await fetch('/api/yandex/webmaster/hosts', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setWmHosts(data.hosts || []); }
    setLoadingHosts(false);
  };

  const loadMcCounters = async () => {
    setLoadingCounters(true);
    const token = await getToken();
    const res = await fetch('/api/yandex/metrica/counters', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setMcCounters(data.counters || []); }
    setLoadingCounters(false);
  };

  const loadGscSites = async () => {
    setLoadingGscSites(true);
    const token = await getToken();
    const res = await fetch('/api/google/search-console/sites', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setGscSites(data.sites || []); }
    setLoadingGscSites(false);
  };

  const loginWithGoogle = async () => {
    setGscOAuthLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/google/auth-url', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      const popup = window.open(data.url, 'google_oauth', 'width=600,height=700');
      const handler = (e: MessageEvent) => {
        if (e.data === 'gsc_connected') {
          window.removeEventListener('message', handler);
          fetchAll();
        }
      };
      window.addEventListener('message', handler);
      const check = setInterval(() => {
        if (popup?.closed) { clearInterval(check); window.removeEventListener('message', handler); setGscOAuthLoading(false); fetchAll(); }
      }, 500);
    } catch (e: any) { alert('Ошибка: ' + e.message); }
    finally { setGscOAuthLoading(false); }
  };

  useEffect(() => { if (wmConn && wmHosts.length === 0 && !loadingHosts) loadWmHosts(); }, [wmConn]);
  useEffect(() => { if (mcConn && mcCounters.length === 0 && !loadingCounters) loadMcCounters(); }, [mcConn]);
  useEffect(() => { if (gscConn && gscSites.length === 0 && !loadingGscSites) loadGscSites(); }, [gscConn]);

  const assignToProject = async (value: string, projectId: string, type: 'webmaster' | 'metrica' | 'gsc') => {
    const token = await getToken();
    const serviceMap = { webmaster: 'yandex_webmaster', metrica: 'yandex_metrica', gsc: 'google_search_console' };
    const fieldMap = { webmaster: 'hostId', metrica: 'counterId', gsc: 'siteUrl' };
    const service = serviceMap[type];
    const field = fieldMap[type];
    const conn = connections.find(c => c.service === service);
    if (!conn) return;

    const existing = connections.find(c => c.service === service && c.projectId === projectId);
    if (existing) {
      await fetch(`/api/seo-connections/${existing.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value || null, projectId: value ? projectId : null }),
      });
    } else if (value) {
      await fetch('/api/seo-connections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, [field]: value, projectId }),
      });
    }
    await fetchAll();
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Отключить сервис?')) return;
    const token = await getToken();
    await fetch(`/api/seo-connections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const svc = connections.find(c => c.id === id)?.service;
    if (svc === 'yandex_webmaster') setWmHosts([]);
    if (svc === 'yandex_metrica') setMcCounters([]);
    if (svc === 'google_search_console') setGscSites([]);
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

  const getProjectBindings = (projectId: string) => ({
    wmBind: connections.find(c => c.service === 'yandex_webmaster' && c.projectId === projectId),
    mcBind: connections.find(c => c.service === 'yandex_metrica' && c.projectId === projectId),
    gscBind: connections.find(c => c.service === 'google_search_console' && c.projectId === projectId),
  });

  const ServiceCard = ({ title, icon: Icon, color, connected, conn, tokenVal, setToken, connecting, onConnect, onRefresh, refreshing, onDisconnect, count, countLabel }: any) => (
    <div className="border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${color}-500`} />
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
        </div>
        {connected ? (
          <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Подключено
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Нет
          </span>
        )}
      </div>
      {!connected ? (
        <div className="space-y-2">
          <input value={tokenVal} onChange={(e: any) => setToken(e.target.value)} placeholder="OAuth-токен"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          <button onClick={onConnect} disabled={!tokenVal || connecting}
            className={`w-full py-2 bg-${color}-500 text-white text-sm font-medium rounded-lg hover:bg-${color}-600 disabled:opacity-50`}
            style={{ backgroundColor: connecting ? undefined : `var(--${color})` }}>
            {connecting ? 'Подключение...' : 'Подключить'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{countLabel}: <strong>{count}</strong></p>
          <div className="flex gap-2">
            <button onClick={onRefresh} disabled={refreshing} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Обновить
            </button>
            <button onClick={onDisconnect} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
              <Unlink className="w-3 h-3" /> Отключить
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ServiceCard title="Вебмастер" icon={Globe} color="red" connected={!!wmConn} conn={wmConn}
                  tokenVal={wmToken} setToken={setWmToken} connecting={connectingWm}
                  onConnect={() => { setConnectingWm(true); connectByToken('yandex_webmaster', wmToken).finally(() => setConnectingWm(false)); }}
                  onRefresh={loadWmHosts} refreshing={loadingHosts}
                  onDisconnect={() => wmConn && deleteConnection(wmConn.id)}
                  count={wmHosts.length} countLabel="Сайтов" />

                <ServiceCard title="Метрика" icon={BarChart3} color="amber" connected={!!mcConn} conn={mcConn}
                  tokenVal={mcToken} setToken={setMcToken} connecting={connectingMc}
                  onConnect={() => { setConnectingMc(true); connectByToken('yandex_metrica', mcToken).finally(() => setConnectingMc(false)); }}
                  onRefresh={loadMcCounters} refreshing={loadingCounters}
                  onDisconnect={() => mcConn && deleteConnection(mcConn.id)}
                  count={mcCounters.length} countLabel="Счётчиков" />

                <div className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-slate-800 text-sm">Google Search Console</span>
                    </div>
                    {gscConn ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Подключено
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Нет
                      </span>
                    )}
                  </div>
                  {!gscConn ? (
                    <div className="space-y-2">
                      <button onClick={loginWithGoogle} disabled={gscOAuthLoading}
                        className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        {gscOAuthLoading ? 'Подключение...' : 'Войти через Google'}
                      </button>
                      <div className="relative flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-[10px] text-slate-400 uppercase">или токен</span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      <input value={gscToken} onChange={(e: any) => setGscToken(e.target.value)} placeholder="OAuth-токен (вручную)"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      <button onClick={() => { setConnectingGsc(true); connectByToken('google_search_console', gscToken).finally(() => setConnectingGsc(false)); }}
                        disabled={!gscToken || connectingGsc}
                        className="w-full py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50">
                        {connectingGsc ? 'Подключение...' : 'Подключить по токену'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">Сайтов: <strong>{gscSites.length}</strong></p>
                      <div className="flex gap-2">
                        <button onClick={loadGscSites} disabled={loadingGscSites} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                          <RefreshCw className={`w-3 h-3 ${loadingGscSites ? 'animate-spin' : ''}`} /> Обновить
                        </button>
                        <button onClick={() => gscConn && deleteConnection(gscConn.id)} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
                          <Unlink className="w-3 h-3" /> Отключить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!wmConn && !mcConn && !gscConn && (
                <p className="text-xs text-slate-400 mt-3">
                  Яндекс: получите токен в <a href="https://oauth.yandex.ru" target="_blank" rel="noopener" className="text-blue-500 hover:underline">oauth.yandex.ru</a>.{' '}
                  Google: нажмите «Войти через Google» (настройте Client ID/Secret в Настройках → Интеграции).
                </p>
              )}
            </div>

            {(wmConn || mcConn || gscConn) && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Шаг 2 — Привяжите сайты к проектам</h2>
                {activeProjects.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm mb-1">Нет проектов</p>
                    <p className="text-xs">Создайте проект в разделе Задачи</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.map(project => {
                      const { wmBind, mcBind, gscBind } = getProjectBindings(project.id);
                      return (
                        <div key={project.id} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                            <span className="font-semibold text-slate-800 text-sm">{project.name}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {wmConn && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1"><Globe className="w-3 h-3 inline mr-1" />Вебмастер</label>
                                <select value={wmBind?.hostId || ''}
                                  onChange={e => assignToProject(e.target.value, project.id, 'webmaster')}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                                  <option value="">— не выбран —</option>
                                  {wmHosts.map((h: any) => <option key={h.host_id} value={h.host_id}>{h.host_id}</option>)}
                                </select>
                              </div>
                            )}
                            {mcConn && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1"><BarChart3 className="w-3 h-3 inline mr-1" />Метрика</label>
                                <select value={mcBind?.counterId || ''}
                                  onChange={e => assignToProject(e.target.value, project.id, 'metrica')}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                                  <option value="">— не выбран —</option>
                                  {mcCounters.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name} — {c.site}</option>)}
                                </select>
                              </div>
                            )}
                            {gscConn && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1"><Search className="w-3 h-3 inline mr-1" />Google SC</label>
                                <select value={gscBind?.siteUrl || ''}
                                  onChange={e => assignToProject(e.target.value, project.id, 'gsc')}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                                  <option value="">— не выбран —</option>
                                  {gscSites.map((s: any) => <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>)}
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
                {connections.length === 0 ? 'Сначала подключите токены' : `Подключено: ${new Set(connections.map(c => c.service)).size} сервисов`}
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
                        const { wmBind, mcBind, gscBind } = getProjectBindings(p.id);
                        const has = wmBind?.hostId || mcBind?.counterId || gscBind?.siteUrl;
                        return <option key={p.id} value={p.id}>{p.name} {has ? '' : '(нет привязок)'}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Название</label>
                    <input value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                      placeholder="Автоматически"
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
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50">Создать</button>
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
                            {generating === r.id ? 'Сбор...' : r.status === 'ready' ? 'Обновить' : 'Собрать'}
                          </button>
                          <button onClick={() => deleteReport(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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

// ---- Helpers ----
function DeltaBadge({ curr, prev, invert }: { curr: number; prev: number; invert?: boolean }) {
  if (prev === 0 && curr === 0) return null;
  const d = curr - prev;
  const pct = prev > 0 ? Math.round((d / prev) * 100) : curr > 0 ? 100 : 0;
  const isGood = invert ? d <= 0 : d >= 0;
  if (d === 0) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ml-1.5 ${isGood ? 'text-green-600' : 'text-red-500'}`}>
      {d > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {d > 0 ? '+' : ''}{pct}%
    </span>
  );
}

function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtNum(n: number) { return n.toLocaleString('ru'); }

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 mt-2 leading-relaxed print:text-[10px]">{children}</p>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 print:bg-white print:border-slate-200">
      <p className="text-xs text-blue-700 leading-relaxed print:text-slate-600">{children}</p>
    </div>
  );
}

function positionLabel(pos: number): { text: string; color: string } {
  if (pos <= 3) return { text: 'Топ-3', color: 'text-green-600' };
  if (pos <= 10) return { text: 'Первая страница', color: 'text-blue-600' };
  if (pos <= 30) return { text: 'Страницы 2-3', color: 'text-amber-600' };
  return { text: 'Далеко от топа', color: 'text-slate-500' };
}

// ---- Report View ----
function ReportView({ report, projects, onBack, onRegenerate, generating, onUpdateData }: {
  report: Report; projects: Project[]; onBack: () => void; onRegenerate: () => void;
  generating: boolean; onUpdateData: (data: any) => void;
}) {
  const d = report.data || {};
  const wm = d.webmaster;
  const mc = d.metrica;
  const gsc = d.gsc;
  const pwm = d.prevWebmaster;
  const pmc = d.prevMetrica;
  const pgsc = d.prevGsc;
  const tasks = d.tasks || [];
  const project = projects.find(p => p.id === report.projectId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set([
    'summary', 'visibility', 'traffic', 'queries', 'gsc-queries',
    'sources', 'devices', 'geography', 'pages', 'gsc-pages',
    'tasks', 'indexing', 'search-engines',
  ]));
  const toggle = (s: string) => {
    const next = new Set(expanded);
    if (next.has(s)) next.delete(s); else next.add(s);
    setExpanded(next);
  };

  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newTask, setNewTask] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  const updateTasks = (t: any[]) => onUpdateData({ ...d, tasks: t });
  const addTask = () => { if (!newTask.trim()) return; updateTasks([...tasks, { title: newTask.trim(), done: false }]); setNewTask(''); taskInputRef.current?.focus(); };
  const removeTask = (i: number) => updateTasks(tasks.filter((_: any, idx: number) => idx !== i));
  const toggleTask = (i: number) => updateTasks(tasks.map((t: any, idx: number) => idx === i ? { ...t, done: !t.done, completedAt: t.done ? null : new Date().toISOString() } : t));
  const startEdit = (i: number) => { setEditingTask(i); setEditText(tasks[i].title); };
  const saveEdit = () => { if (editingTask === null) return; if (editText.trim()) updateTasks(tasks.map((t: any, idx: number) => idx === editingTask ? { ...t, title: editText.trim() } : t)); setEditingTask(null); };

  const handlePrint = () => window.print();

  const Section = ({ id, title, subtitle, icon: Icon, count, children }: { id: string; title: string; subtitle?: string; icon: any; count?: number; children: React.ReactNode }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300 print:break-inside-avoid">
      <button onClick={() => toggle(id)} className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-slate-50 transition-colors print:py-2 text-left">
        {expanded.has(id) ? <ChevronDown className="w-4 h-4 text-slate-400 print:hidden flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 print:hidden flex-shrink-0" />}
        <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          {count !== undefined && <span className="text-xs text-slate-400 ml-1">({count})</span>}
          {subtitle && <span className="text-xs text-slate-400 ml-2 hidden sm:inline">{subtitle}</span>}
        </div>
      </button>
      {expanded.has(id) && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );

  const StatCard = ({ label, value, prev: prevVal, color = 'blue', invert, isSec, isPct, hint }: {
    label: string; value: number; prev?: number; color?: string; invert?: boolean; isSec?: boolean; isPct?: boolean; hint?: string;
  }) => {
    const bgColors: Record<string, string> = {
      blue: 'bg-blue-50', sky: 'bg-sky-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50',
      purple: 'bg-purple-50', indigo: 'bg-indigo-50', teal: 'bg-teal-50', rose: 'bg-rose-50',
      green: 'bg-green-50', red: 'bg-red-50', cyan: 'bg-cyan-50', violet: 'bg-violet-50',
    };
    const fmt = (v: number) => isPct ? `${v}%` : isSec ? fmtDur(v) : fmtNum(v);
    return (
      <div className={`${bgColors[color] || 'bg-slate-50'} rounded-xl p-4 print:p-3 print:rounded-lg`}>
        <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1 flex-wrap">
          <p className="text-2xl font-bold text-slate-800 print:text-xl">{fmt(value)}</p>
          {prevVal !== undefined && <DeltaBadge curr={value} prev={prevVal} invert={invert} />}
        </div>
        {prevVal !== undefined && prevVal > 0 && (
          <p className="text-[11px] text-slate-400 mt-1">Было: {fmt(prevVal)}</p>
        )}
        {hint && <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{hint}</p>}
      </div>
    );
  };

  const periodLabel = d.dateFrom && d.dateTo ? `${d.dateFrom} — ${d.dateTo}` : report.dateFrom && report.dateTo ? `${report.dateFrom} — ${report.dateTo}` : '';
  const prevPeriodLabel = d.prevDateFrom && d.prevDateTo ? `${d.prevDateFrom} — ${d.prevDateTo}` : '';

  const deviceIcons: Record<string, any> = { 'desktop': Monitor, 'mobile': Smartphone, 'tablet': Tablet };
  const deviceNames: Record<string, string> = { 'desktop': 'Компьютеры', 'mobile': 'Телефоны', 'tablet': 'Планшеты' };

  const totalClicks = (wm?.totalClicks || 0) + (gsc?.totalClicks || 0);
  const prevTotalClicks = (pwm?.totalClicks || 0) + (pgsc?.totalClicks || 0);
  const totalImpressions = (wm?.totalImpressions || 0) + (gsc?.totalImpressions || 0);
  const prevTotalImpressions = (pwm?.totalImpressions || 0) + (pgsc?.totalImpressions || 0);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6 py-8 print:px-4 print:py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg no-print">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 print:text-xl">{report.title}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {project && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>}
                {periodLabel && <span className="text-xs text-slate-500">{periodLabel}</span>}
                {prevPeriodLabel && <span className="text-xs text-slate-400">vs {prevPeriodLabel}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">
              <Printer className="w-4 h-4" /> PDF
            </button>
            <button onClick={onRegenerate} disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {generating ? 'Обновление...' : 'Обновить'}
            </button>
          </div>
        </div>

        <div className="space-y-4 print:space-y-3">

          {/* ==== SUMMARY for business owner ==== */}
          {(wm || mc || gsc) && (
            <Section id="summary" title="Краткие итоги" subtitle="Главное за период" icon={TrendingUp}>
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl p-5 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-800">{fmtNum(totalClicks)}</p>
                    <p className="text-xs text-slate-500 mt-1">переходов из поиска</p>
                    {prevTotalClicks > 0 && <DeltaBadge curr={totalClicks} prev={prevTotalClicks} />}
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-800">{fmtNum(totalImpressions)}</p>
                    <p className="text-xs text-slate-500 mt-1">раз вас видели в поиске</p>
                    {prevTotalImpressions > 0 && <DeltaBadge curr={totalImpressions} prev={prevTotalImpressions} />}
                  </div>
                  {mc && (
                    <>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-slate-800">{fmtNum(mc.users || 0)}</p>
                        <p className="text-xs text-slate-500 mt-1">уникальных посетителей</p>
                        {pmc?.users > 0 && <DeltaBadge curr={mc.users || 0} prev={pmc.users} />}
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-slate-800">{fmtDur(mc.avgDuration || 0)}</p>
                        <p className="text-xs text-slate-500 mt-1">среднее время на сайте</p>
                        {pmc?.avgDuration > 0 && <DeltaBadge curr={mc.avgDuration || 0} prev={pmc.avgDuration} />}
                      </div>
                    </>
                  )}
                </div>
                <Hint>
                  Переходы из поиска = люди, которые нашли вас в Яндексе или Google и кликнули на ваш сайт. Чем больше, тем эффективнее SEO-продвижение. Показы = сколько раз ваш сайт появлялся в результатах поиска.
                </Hint>
              </div>

              {mc && mc.bounceRate > 0 && (
                <div className={`rounded-xl p-4 ${mc.bounceRate > 40 ? 'bg-amber-50 border border-amber-100' : 'bg-green-50 border border-green-100'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Показатель отказов: {mc.bounceRate}%</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {mc.bounceRate <= 20 ? 'Отлично! Посетители изучают сайт.' :
                         mc.bounceRate <= 40 ? 'Хорошо. Большинство посетителей остаются на сайте.' :
                         mc.bounceRate <= 60 ? 'Средний показатель. Есть куда расти.' :
                         'Высокий. Многие уходят сразу. Стоит улучшить контент или скорость сайта.'}
                      </p>
                    </div>
                    {pmc?.bounceRate > 0 && <DeltaBadge curr={mc.bounceRate} prev={pmc.bounceRate} invert />}
                  </div>
                  <Hint>Отказ = посетитель открыл сайт и ушёл, не посмотрев другие страницы. Норма для лендинга: до 60%. Для многостраничного сайта: до 30%.</Hint>
                </div>
              )}
            </Section>
          )}

          {/* ==== VISIBILITY: Yandex + Google ==== */}
          {(wm || gsc) && (
            <Section id="visibility" title="Видимость в поисковых системах" subtitle="Как вас находят" icon={Eye}>
              {wm && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center"><span className="text-red-600 text-xs font-bold">Я</span></div>
                    <p className="text-sm font-semibold text-slate-700">Яндекс</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Переходы" value={wm.totalClicks || 0} prev={pwm?.totalClicks} color="blue"
                      hint="Сколько раз кликнули на ваш сайт в Яндексе" />
                    <StatCard label="Показы" value={wm.totalImpressions || 0} prev={pwm?.totalImpressions} color="sky"
                      hint="Сколько раз вас увидели в выдаче" />
                    <StatCard label="CTR" value={wm.avgCtr || 0} prev={pwm?.avgCtr} color="emerald" isPct
                      hint="% людей, кто кликнул. Норма: 3-10%" />
                    <StatCard label="Ср. позиция" value={wm.avgPosition || 0} prev={pwm?.avgPosition} color="amber" invert
                      hint="Чем ниже число, тем выше в поиске. Цель: до 10" />
                  </div>
                </div>
              )}
              {gsc && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center"><span className="text-blue-600 text-xs font-bold">G</span></div>
                    <p className="text-sm font-semibold text-slate-700">Google</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Переходы" value={gsc.totalClicks || 0} prev={pgsc?.totalClicks} color="cyan"
                      hint="Сколько раз кликнули на ваш сайт в Google" />
                    <StatCard label="Показы" value={gsc.totalImpressions || 0} prev={pgsc?.totalImpressions} color="violet"
                      hint="Сколько раз вас увидели в выдаче" />
                    <StatCard label="CTR" value={gsc.avgCtr || 0} prev={pgsc?.avgCtr} color="emerald" isPct
                      hint="% людей, кто кликнул. Норма: 3-10%" />
                    <StatCard label="Ср. позиция" value={gsc.avgPosition || 0} prev={pgsc?.avgPosition} color="amber" invert
                      hint="Чем ниже число, тем выше в поиске. Цель: до 10" />
                  </div>
                </div>
              )}
              <Tip>CTR (кликабельность) показывает, насколько привлекательно выглядит ваш сайт в поисковой выдаче. Если CTR ниже 3% — стоит переработать заголовки и описания страниц (Title и Description).</Tip>
            </Section>
          )}

          {/* ---- Indexing ---- */}
          {wm?.indexing && (
            <Section id="indexing" title="Индексация сайта" subtitle="Сколько страниц Яндекс знает о вашем сайте" icon={Globe}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <StatCard label="Страниц в поиске" value={wm.indexing.indexed} prev={pwm?.indexing?.indexed} color="green"
                  hint="Эти страницы могут показываться пользователям" />
                <StatCard label="Исключено из поиска" value={wm.indexing.excluded} prev={pwm?.indexing?.excluded} color="red" invert
                  hint="Яндекс решил не показывать эти страницы" />
              </div>
              <Hint>Если исключённых страниц много — возможны дубли, пустые страницы или технические ошибки. Нужна техническая проверка сайта.</Hint>
            </Section>
          )}

          {/* ---- Traffic ---- */}
          {mc && (
            <Section id="traffic" title="Посещаемость сайта" subtitle="Кто и сколько заходит" icon={BarChart3}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <StatCard label="Визиты" value={mc.visits || 0} prev={pmc?.visits} color="purple"
                  hint="Общее количество посещений сайта" />
                <StatCard label="Просмотры страниц" value={mc.pageviews || 0} prev={pmc?.pageviews} color="indigo"
                  hint="Сколько страниц посмотрели в сумме" />
                <StatCard label="Уникальные посетители" value={mc.users || 0} prev={pmc?.users} color="teal"
                  hint="Количество разных людей" />
                <StatCard label="Время на сайте" value={mc.avgDuration || 0} prev={pmc?.avgDuration} color="blue" isSec
                  hint="Среднее. Хорошо: более 1:30" />
              </div>
              {mc.visits > 0 && mc.users > 0 && (
                <Hint>В среднем каждый посетитель смотрит {(mc.pageviews / mc.users).toFixed(1)} страниц. {mc.pageviews / mc.users >= 2 ? 'Это хорошо — люди изучают сайт.' : 'Стоит добавить перелинковку между страницами.'}</Hint>
              )}
            </Section>
          )}

          {/* ---- Yandex Queries ---- */}
          {wm?.queries && wm.queries.length > 0 && (
            <Section id="queries" title="По каким запросам вас находят в Яндексе" subtitle="Топ поисковых фраз" icon={Search} count={wm.queries.length}>
              <Hint>Это запросы, по которым пользователи видят ваш сайт в Яндексе. Зелёная позиция (1-3) = топ, синяя (4-10) = первая страница, жёлтая (11-30) = потенциал роста.</Hint>
              <div className="mt-3">
                <QueriesTable queries={wm.queries} prevQueries={pwm?.queries} />
              </div>
              <Tip>Запросы на позициях 5-15 — зона роста. Небольшая доработка страниц под эти запросы может вывести их в топ-3 и значительно увеличить трафик.</Tip>
            </Section>
          )}

          {/* ---- GSC Queries ---- */}
          {gsc?.queries && gsc.queries.length > 0 && (
            <Section id="gsc-queries" title="По каким запросам вас находят в Google" subtitle="Топ поисковых фраз" icon={Search} count={gsc.queries.length}>
              <Hint>Аналогичная таблица, но для Google. Часто запросы отличаются от Яндекса.</Hint>
              <div className="mt-3">
                <QueriesTable queries={gsc.queries} prevQueries={pgsc?.queries} />
              </div>
            </Section>
          )}

          {/* ---- Devices ---- */}
          {mc?.devices && mc.devices.length > 0 && (
            <Section id="devices" title="С каких устройств заходят" subtitle="Компьютеры, телефоны, планшеты" icon={Monitor}>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {mc.devices.map((dv: any, i: number) => {
                  const prevD = pmc?.devices?.find((pd: any) => pd.name === dv.name);
                  const DevIcon = deviceIcons[dv.name?.toLowerCase()] || Monitor;
                  return (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
                      <DevIcon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs text-slate-500 mb-1">{deviceNames[dv.name?.toLowerCase()] || dv.name}</p>
                      <p className="text-xl font-bold text-slate-800">{dv.percentage}%</p>
                      <p className="text-sm text-slate-500">{fmtNum(dv.visits)} визитов</p>
                      {prevD && <DeltaBadge curr={dv.visits} prev={prevD.visits} />}
                    </div>
                  );
                })}
              </div>
              {(() => {
                const mobile = mc.devices.find((dv: any) => dv.name?.toLowerCase() === 'mobile');
                if (mobile && mobile.percentage > 50) return <Tip>Более половины посетителей заходят с телефона. Убедитесь, что сайт удобен на мобильных: быстро грузится, кнопки достаточного размера, текст читается без увеличения.</Tip>;
                return null;
              })()}
            </Section>
          )}

          {/* ---- Traffic Sources ---- */}
          {mc?.sources && mc.sources.length > 0 && (
            <Section id="sources" title="Откуда приходят посетители" subtitle="Источники трафика" icon={ArrowUpRight} count={mc.sources.length}>
              <Hint>Показывает, откуда люди приходят на ваш сайт: из поиска, напрямую, из соцсетей или по рекламе.</Hint>
              <div className="space-y-2.5 mt-3">
                {mc.sources.map((s: any, i: number) => {
                  const prevS = pmc?.sources?.find((ps: any) => ps.name === s.name);
                  const nameMap: Record<string, string> = {
                    'Переходы из поисковых систем': 'Поисковые системы',
                    'Прямые заходы': 'Напрямую (ввод адреса)',
                    'Переходы по ссылкам на сайтах': 'Ссылки с других сайтов',
                    'Переходы из социальных сетей': 'Соц. сети',
                    'Переходы по рекламе': 'Реклама',
                    'Внутренние переходы': 'Внутренние',
                  };
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 w-44 truncate font-medium">{nameMap[s.name] || s.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                        {prevS && prevS.percentage > 0 && (
                          <div className="absolute h-full bg-slate-200 rounded-full" style={{ width: `${Math.max(prevS.percentage, 3)}%` }} />
                        )}
                        <div className="relative h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 text-[10px] text-white font-medium"
                          style={{ width: `${Math.max(s.percentage, 3)}%` }}>
                          {s.percentage > 8 ? `${s.percentage}%` : ''}
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-sm font-medium text-slate-700">{fmtNum(s.visits)}</span>
                        {prevS && <DeltaBadge curr={s.visits} prev={prevS.visits} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Tip>Доля поискового трафика показывает эффективность SEO. Если меньше 40% — есть потенциал для роста через оптимизацию.</Tip>
            </Section>
          )}

          {/* ---- Search Engines ---- */}
          {mc?.searchEngines && mc.searchEngines.length > 0 && (
            <Section id="search-engines" title="Яндекс vs Google" subtitle="Соотношение поисковиков" icon={Search}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {mc.searchEngines.map((se: any, i: number) => {
                  const prev = pmc?.searchEngines?.find((p: any) => p.name === se.name);
                  return (
                    <div key={i} className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-slate-600 mb-1">{se.name}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-xl font-bold text-slate-800">{fmtNum(se.visits)}</p>
                        {prev && <DeltaBadge curr={se.visits} prev={prev.visits} />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">переходов</p>
                    </div>
                  );
                })}
              </div>
              <Hint>Если трафик идёт только из одной поисковой системы — стоит оптимизировать сайт и для второй, чтобы не зависеть от одного источника.</Hint>
            </Section>
          )}

          {/* ---- Geography ---- */}
          {mc?.geography && mc.geography.length > 0 && (
            <Section id="geography" title="Города посетителей" subtitle="Откуда заходят на сайт" icon={MapPin} count={mc.geography.length}>
              <Hint>Проверьте, совпадает ли география посетителей с вашей целевой аудиторией. Если нет — нужна корректировка геотаргетинга.</Hint>
              <div className="space-y-1.5 mt-3">
                {mc.geography.map((g: any, i: number) => {
                  const prevG = pmc?.geography?.find((pg: any) => pg.city === g.city);
                  return (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-400 w-6 text-right">{i + 1}.</span>
                      <span className="flex-1 text-sm text-slate-700 font-medium">{g.city}</span>
                      <span className="text-xs text-slate-400">{g.percentage}%</span>
                      <span className="text-sm font-medium text-slate-700 w-16 text-right">{fmtNum(g.visits)}</span>
                      {prevG && <DeltaBadge curr={g.visits} prev={prevG.visits} />}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ---- Top Pages ---- */}
          {mc?.topPages && mc.topPages.length > 0 && (
            <Section id="pages" title="Самые посещаемые страницы" subtitle="Что смотрят на сайте" icon={FileText} count={mc.topPages.length}>
              <Hint>Самые популярные страницы вашего сайта. Обратите внимание: приносят ли они заявки? Если нет — добавьте формы и призывы к действию.</Hint>
              <div className="space-y-1 mt-3">
                {mc.topPages.map((p: any, i: number) => {
                  const prevP = pmc?.topPages?.find((pp: any) => pp.url === p.url);
                  return (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-400 w-6 text-right">{i + 1}.</span>
                      <span className="flex-1 text-slate-700 truncate text-xs">{p.url}</span>
                      <span className="text-sm text-slate-700 font-medium">{fmtNum(p.views)} просмотров</span>
                      {prevP && <DeltaBadge curr={p.views} prev={prevP.views} />}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ---- GSC Pages ---- */}
          {gsc?.pages && gsc.pages.length > 0 && (
            <Section id="gsc-pages" title="Топ страниц в Google" subtitle="Какие страницы приносят трафик из Google" icon={FileText} count={gsc.pages.length}>
              <div className="space-y-1">
                {gsc.pages.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400 w-6 text-right">{i + 1}.</span>
                    <span className="flex-1 text-slate-700 truncate text-xs">{p.url}</span>
                    <span className="text-sm text-slate-700 font-medium">{fmtNum(p.clicks)} кликов</span>
                    <span className="text-xs text-slate-400">{fmtNum(p.impressions)} показов</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ---- Editable Tasks ---- */}
          <Section id="tasks" title="Что было сделано" subtitle="Выполненные и запланированные работы" icon={CheckCircle2} count={tasks.length}>
            <div className="space-y-1 mb-3">
              {tasks.length === 0 && (
                <p className="text-sm text-slate-400 py-2">Добавьте выполненные работы вручную или нажмите «Обновить» для загрузки задач из проекта.</p>
              )}
              {tasks.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-1.5 group">
                  <button onClick={() => toggleTask(i)}
                    className={`w-4 h-4 rounded-[3px] border-2 flex-shrink-0 flex items-center justify-center transition-colors no-print ${t.done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}>
                    {t.done && <span className="text-white text-[10px]">&#10003;</span>}
                  </button>
                  <span className="hidden print:inline-block w-4 h-4 rounded-[3px] border-2 flex-shrink-0 text-center leading-4 text-[10px]"
                    style={{ backgroundColor: t.done ? '#22c55e' : 'transparent', borderColor: t.done ? '#22c55e' : '#cbd5e1', color: 'white' }}>
                    {t.done ? '✓' : ''}
                  </span>
                  {editingTask === i ? (
                    <div className="flex-1 flex items-center gap-1 no-print">
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
                      <button onClick={() => startEdit(i)} className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity no-print"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeTask(i)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity no-print"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 no-print">
              <input ref={taskInputRef} value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
                placeholder="Добавить выполненную работу..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400" />
              <button onClick={addTask} disabled={!newTask.trim()}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Section>

          {!wm && !mc && !gsc && tasks.length === 0 && (
            <div className="text-center py-12 text-slate-400 no-print">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="mb-2">Нет данных</p>
              <p className="text-sm">Привяжите сайт к проекту и нажмите «Обновить»</p>
            </div>
          )}
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
          {d.generatedAt && <p>Отчёт сгенерирован: {new Date(d.generatedAt).toLocaleString('ru')}</p>}
        </div>
      </div>
    </div>
  );
}

// ---- Queries Table (reusable for Yandex + Google) ----
function QueriesTable({ queries, prevQueries }: { queries: any[]; prevQueries?: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <th className="pb-2 pr-3 w-8">#</th>
            <th className="pb-2 pr-3">Запрос</th>
            <th className="pb-2 pr-3 text-right">Переходы</th>
            <th className="pb-2 pr-3 text-right">Показы</th>
            <th className="pb-2 pr-3 text-right">CTR</th>
            <th className="pb-2 text-right">Позиция</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((q: any, i: number) => {
            const prev = prevQueries?.find((pq: any) => pq.query === q.query);
            const pl = positionLabel(q.position);
            return (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="py-2.5 pr-3 text-xs text-slate-400">{i + 1}</td>
                <td className="py-2.5 pr-3 text-slate-700 max-w-[280px] truncate font-medium">{q.query}</td>
                <td className="py-2.5 pr-3 text-right">
                  <span className="font-medium">{q.clicks}</span>
                  {prev && <DeltaBadge curr={q.clicks} prev={prev.clicks} />}
                </td>
                <td className="py-2.5 pr-3 text-right text-slate-500">{fmtNum(q.impressions)}</td>
                <td className="py-2.5 pr-3 text-right text-slate-500">{q.ctr}%</td>
                <td className="py-2.5 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${q.position <= 3 ? 'bg-green-100 text-green-700' : q.position <= 10 ? 'bg-blue-100 text-blue-700' : q.position <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {q.position}
                  </span>
                  {prev && prev.position !== q.position && (
                    <span className={`text-[10px] ml-1 ${q.position < prev.position ? 'text-green-600' : 'text-red-500'}`}>
                      {q.position < prev.position ? `▲${Math.round(prev.position - q.position)}` : `▼${Math.round(q.position - prev.position)}`}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
