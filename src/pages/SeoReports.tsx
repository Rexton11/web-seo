import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, BarChart3, Globe, TrendingUp, Search,
  Eye, MousePointerClick, ArrowUpRight, FileText, RefreshCw, Settings,
  Link2, CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronRight,
  Download, Calendar, Filter, Loader2
} from 'lucide-react';

type Tab = 'reports' | 'connections' | 'settings';

interface Connection {
  id: string;
  service: string;
  siteUrl?: string;
  accessToken?: string;
  hostId?: string;
  counterId?: string;
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
}

export default function SeoReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('reports');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const [newReport, setNewReport] = useState({ title: '', projectId: '', dateFrom: '', dateTo: '' });
  const [showNewReport, setShowNewReport] = useState(false);

  const [yandexForm, setYandexForm] = useState({ clientId: '', clientSecret: '' });
  const [wmToken, setWmToken] = useState('');
  const [mcToken, setMcToken] = useState('');
  const [wmHosts, setWmHosts] = useState<any[]>([]);
  const [mcCounters, setMcCounters] = useState<any[]>([]);
  const [connectingWm, setConnectingWm] = useState(false);
  const [connectingMc, setConnectingMc] = useState(false);

  const getToken = useCallback(async () => user ? await user.getIdToken() : '', [user]);

  const fetchAll = useCallback(async () => {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const [connRes, repRes, projRes, setRes] = await Promise.all([
      fetch('/api/seo-connections', { headers }),
      fetch('/api/seo-reports', { headers }),
      fetch('/api/projects', { headers }),
      fetch('/api/settings', { headers }),
    ]);
    if (connRes.ok) setConnections(await connRes.json());
    if (repRes.ok) setReports(await repRes.json());
    if (projRes.ok) setProjects(await projRes.json());
    if (setRes.ok) {
      const s = await setRes.json();
      setYandexForm({ clientId: s.yandexClientId || '', clientSecret: s.yandexClientSecret || '' });
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const saveYandexSettings = async () => {
    const token = await getToken();
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ yandexClientId: yandexForm.clientId, yandexClientSecret: yandexForm.clientSecret }),
    });
  };

  const connectByToken = async (service: 'yandex_webmaster' | 'yandex_metrica', accessToken: string) => {
    const token = await getToken();
    const res = await fetch('/api/seo-connections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, accessToken }),
    });
    if (res.ok) {
      await fetchAll();
      if (service === 'yandex_webmaster') { setWmToken(''); loadWmHosts(); }
      if (service === 'yandex_metrica') { setMcToken(''); loadMcCounters(); }
    }
  };

  const loadWmHosts = async () => {
    const token = await getToken();
    const res = await fetch('/api/yandex/webmaster/hosts', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setWmHosts(data.hosts || []);
    }
  };

  const loadMcCounters = async () => {
    const token = await getToken();
    const res = await fetch('/api/yandex/metrica/counters', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMcCounters(data.counters || []);
    }
  };

  const setConnectionField = async (connId: string, field: string, value: string) => {
    const token = await getToken();
    await fetch(`/api/seo-connections/${connId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    await fetchAll();
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Удалить подключение?')) return;
    const token = await getToken();
    await fetch(`/api/seo-connections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await fetchAll();
  };

  const createReport = async () => {
    const token = await getToken();
    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const res = await fetch('/api/seo-reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newReport.title || `SEO Отчёт ${today}`,
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
      const report = await repRes.json();
      setViewReport(report);
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

  const wmConn = connections.find(c => c.service === 'yandex_webmaster');
  const mcConn = connections.find(c => c.service === 'yandex_metrica');

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );

  if (viewReport) {
    return <ReportView report={viewReport} projects={projects} onBack={() => setViewReport(null)} onRegenerate={() => generateReport(viewReport.id)} generating={generating === viewReport.id} />;
  }

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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          {([
            { id: 'reports' as Tab, label: 'Отчёты', icon: FileText },
            { id: 'connections' as Tab, label: 'Подключения', icon: Link2 },
            { id: 'settings' as Tab, label: 'Настройки', icon: Settings },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Settings */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-800 mb-1">Яндекс OAuth</h3>
              <p className="text-sm text-slate-500 mb-4">
                Создайте приложение на <a href="https://oauth.yandex.ru/client/new" target="_blank" rel="noopener" className="text-blue-500 hover:underline">oauth.yandex.ru</a> с правами на Вебмастер и Метрику. Укажите Callback URL: <code className="bg-slate-100 px-1 rounded text-xs">https://oauth.yandex.ru/verification_code</code>
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
                  <input value={yandexForm.clientId} onChange={e => setYandexForm({ ...yandexForm, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Яндекс Client ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client Secret</label>
                  <input value={yandexForm.clientSecret} onChange={e => setYandexForm({ ...yandexForm, clientSecret: e.target.value })} type="password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Яндекс Client Secret" />
                </div>
              </div>
              <button onClick={saveYandexSettings} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600">
                Сохранить
              </button>
            </div>
          </div>
        )}

        {/* Tab: Connections */}
        {tab === 'connections' && (
          <div className="space-y-6">
            {/* Yandex Webmaster */}
            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Яндекс.Вебмастер</h3>
                    <p className="text-xs text-slate-500">Позиции, клики, показы, индексация</p>
                  </div>
                </div>
                {wmConn ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Подключено
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                    <XCircle className="w-3 h-3" /> Не подключено
                  </span>
                )}
              </div>

              {!wmConn ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Вставьте OAuth-токен Яндекса с правами доступа к Вебмастеру:</p>
                  <div className="flex gap-2">
                    <input value={wmToken} onChange={e => setWmToken(e.target.value)} placeholder="OAuth-токен"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    <button onClick={() => { setConnectingWm(true); connectByToken('yandex_webmaster', wmToken).finally(() => setConnectingWm(false)); }}
                      disabled={!wmToken || connectingWm}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">
                      {connectingWm ? 'Подключение...' : 'Подключить'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Получить токен: <a href="https://oauth.yandex.ru/authorize?response_type=token&client_id=ID_ВАШЕГО_ПРИЛОЖЕНИЯ" target="_blank" rel="noopener" className="text-blue-500 hover:underline">oauth.yandex.ru</a> (замените ID на ваш Client ID из настроек)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wmConn.hostId ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>Сайт: <strong>{wmConn.hostId}</strong></span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Выберите сайт:</p>
                      {wmHosts.length === 0 ? (
                        <button onClick={loadWmHosts} className="text-sm text-blue-500 hover:text-blue-600">Загрузить список сайтов</button>
                      ) : (
                        <div className="space-y-1">
                          {wmHosts.map((h: any) => (
                            <button key={h.host_id} onClick={() => setConnectionField(wmConn.id, 'hostId', h.host_id)}
                              className="w-full text-left px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
                              {h.host_id} {h.verified ? '✓' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => deleteConnection(wmConn.id)} className="text-xs text-red-400 hover:text-red-500">Отключить</button>
                </div>
              )}
            </div>

            {/* Yandex Metrica */}
            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Яндекс.Метрика</h3>
                    <p className="text-xs text-slate-500">Визиты, просмотры, источники трафика</p>
                  </div>
                </div>
                {mcConn ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Подключено
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                    <XCircle className="w-3 h-3" /> Не подключено
                  </span>
                )}
              </div>

              {!mcConn ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Вставьте OAuth-токен Яндекса с правами доступа к Метрике:</p>
                  <div className="flex gap-2">
                    <input value={mcToken} onChange={e => setMcToken(e.target.value)} placeholder="OAuth-токен"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    <button onClick={() => { setConnectingMc(true); connectByToken('yandex_metrica', mcToken).finally(() => setConnectingMc(false)); }}
                      disabled={!mcToken || connectingMc}
                      className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50">
                      {connectingMc ? 'Подключение...' : 'Подключить'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {mcConn.counterId ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      <span>Счётчик: <strong>{mcConn.counterId}</strong></span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Выберите счётчик:</p>
                      {mcCounters.length === 0 ? (
                        <button onClick={loadMcCounters} className="text-sm text-blue-500 hover:text-blue-600">Загрузить счётчики</button>
                      ) : (
                        <div className="space-y-1">
                          {mcCounters.map((c: any) => (
                            <button key={c.id} onClick={() => setConnectionField(mcConn.id, 'counterId', String(c.id))}
                              className="w-full text-left px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
                              {c.name} <span className="text-slate-400">(ID: {c.id})</span> — {c.site}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => deleteConnection(mcConn.id)} className="text-xs text-red-400 hover:text-red-500">Отключить</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Reports */}
        {tab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {connections.length === 0
                  ? 'Сначала подключите Яндекс.Вебмастер или Метрику во вкладке "Подключения"'
                  : `Подключено сервисов: ${connections.length}`}
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
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Название</label>
                    <input value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                      placeholder={`SEO Отчёт ${new Date().toISOString().slice(0, 10)}`}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Проект</label>
                    <select value={newReport.projectId} onChange={e => setNewReport({ ...newReport, projectId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                      <option value="">Без проекта</option>
                      {projects.filter(p => !(p as any).archived).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Дата от</label>
                    <input type="date" value={newReport.dateFrom} onChange={e => setNewReport({ ...newReport, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Дата до</label>
                    <input type="date" value={newReport.dateTo} onChange={e => setNewReport({ ...newReport, dateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={createReport} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600">Создать</button>
                  <button onClick={() => setShowNewReport(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Отмена</button>
                </div>
              </div>
            )}

            {reports.length === 0 && !showNewReport ? (
              <div className="text-center py-16 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="mb-2">Нет отчётов</p>
                <p className="text-sm">Создайте первый SEO-отчёт для автоматического сбора данных</p>
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

function ReportView({ report, projects, onBack, onRegenerate, generating }: { report: Report; projects: Project[]; onBack: () => void; onRegenerate: () => void; generating: boolean }) {
  const d = report.data || {};
  const wm = d.webmaster;
  const mc = d.metrica;
  const tasks = d.tasks;
  const project = projects.find(p => p.id === report.projectId);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'queries', 'traffic', 'sources', 'pages', 'tasks']));
  const toggleSection = (s: string) => {
    const next = new Set(expandedSections);
    if (next.has(s)) next.delete(s); else next.add(s);
    setExpandedSections(next);
  };

  const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => toggleSection(id)} className="w-full flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        {expandedSections.has(id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </button>
      {expandedSections.has(id) && <div className="p-5">{children}</div>}
    </div>
  );

  const StatCard = ({ label, value, sub, color = 'blue' }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className={`bg-${color}-50 rounded-xl p-4`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString('ru') : value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {project && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>}
                {report.dateFrom && report.dateTo && <span className="text-xs text-slate-400">{report.dateFrom} — {report.dateTo}</span>}
                {d.generatedAt && <span className="text-xs text-slate-400">Обновлён: {new Date(d.generatedAt).toLocaleString('ru')}</span>}
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
          {/* Overview */}
          {(wm || mc) && (
            <Section id="overview" title="Обзор" icon={TrendingUp}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {wm && (
                  <>
                    <StatCard label="Клики (Яндекс)" value={wm.totalClicks || 0} color="blue" />
                    <StatCard label="Показы (Яндекс)" value={wm.totalImpressions || 0} color="sky" />
                    <StatCard label="CTR" value={`${wm.avgCtr || 0}%`} color="emerald" />
                    <StatCard label="Ср. позиция" value={wm.avgPosition || 0} color="amber" />
                  </>
                )}
                {mc && (
                  <>
                    <StatCard label="Визиты" value={mc.visits || 0} color="purple" />
                    <StatCard label="Просмотры" value={mc.pageviews || 0} color="indigo" />
                    <StatCard label="Посетители" value={mc.users || 0} color="teal" />
                    <StatCard label="Отказы" value={`${mc.bounceRate || 0}%`} color="rose" />
                  </>
                )}
              </div>
            </Section>
          )}

          {/* Webmaster Queries */}
          {wm?.queries && wm.queries.length > 0 && (
            <Section id="queries" title={`Топ запросов (${wm.queries.length})`} icon={Search}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                      <th className="pb-2 pr-4">#</th>
                      <th className="pb-2 pr-4">Запрос</th>
                      <th className="pb-2 pr-4 text-right">Клики</th>
                      <th className="pb-2 pr-4 text-right">Показы</th>
                      <th className="pb-2 pr-4 text-right">CTR</th>
                      <th className="pb-2 text-right">Позиция</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wm.queries.map((q: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 pr-4 text-xs text-slate-400">{i + 1}</td>
                        <td className="py-2 pr-4 text-slate-700 max-w-[300px] truncate">{q.query}</td>
                        <td className="py-2 pr-4 text-right font-medium">{q.clicks}</td>
                        <td className="py-2 pr-4 text-right text-slate-500">{q.impressions}</td>
                        <td className="py-2 pr-4 text-right text-slate-500">{q.ctr}%</td>
                        <td className="py-2 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${q.position <= 3 ? 'bg-green-100 text-green-700' : q.position <= 10 ? 'bg-blue-100 text-blue-700' : q.position <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            {q.position}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Indexing */}
          {wm?.indexing && (
            <Section id="indexing" title="Индексация" icon={Globe}>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="В поиске" value={wm.indexing.indexed} color="green" />
                <StatCard label="Исключено" value={wm.indexing.excluded} color="red" />
              </div>
            </Section>
          )}

          {/* Traffic sources */}
          {mc?.sources && mc.sources.length > 0 && (
            <Section id="sources" title="Источники трафика" icon={ArrowUpRight}>
              <div className="space-y-2">
                {mc.sources.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-40 truncate">{s.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 text-[10px] text-white font-medium"
                        style={{ width: `${Math.max(s.percentage, 5)}%` }}>
                        {s.percentage}%
                      </div>
                    </div>
                    <span className="text-sm text-slate-500 w-16 text-right">{s.visits}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Search engines */}
          {mc?.searchEngines && mc.searchEngines.length > 0 && (
            <Section id="search-engines" title="Поисковые системы" icon={Search}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mc.searchEngines.map((se: any, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-700">{se.name}</p>
                    <p className="text-xl font-bold text-slate-800">{se.visits.toLocaleString('ru')}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Top pages */}
          {mc?.topPages && mc.topPages.length > 0 && (
            <Section id="pages" title={`Топ страниц (${mc.topPages.length})`} icon={FileText}>
              <div className="space-y-1.5">
                {mc.topPages.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="text-xs text-slate-400 w-6">{i + 1}.</span>
                    <span className="flex-1 text-slate-700 truncate text-xs">{p.url}</span>
                    <span className="text-slate-500 font-medium">{p.views.toLocaleString('ru')}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Tasks */}
          {tasks && tasks.length > 0 && (
            <Section id="tasks" title={`Выполненные работы (${tasks.length})`} icon={CheckCircle2}>
              <div className="space-y-1">
                {tasks.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <div className={`w-4 h-4 rounded-[3px] border-2 flex items-center justify-center ${t.status === 'done' || t.completedAt ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                      {(t.status === 'done' || t.completedAt) && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className={`text-sm ${t.completedAt ? 'text-slate-500' : 'text-slate-700'}`}>{t.title}</span>
                    {t.completedAt && <span className="text-xs text-slate-400">{new Date(t.completedAt).toLocaleDateString('ru')}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {!wm && !mc && (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="mb-2">Нет данных</p>
              <p className="text-sm">Подключите Яндекс.Вебмастер или Метрику и нажмите "Обновить данные"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
