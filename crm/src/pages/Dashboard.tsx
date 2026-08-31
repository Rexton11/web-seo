import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Deal, KanbanColumn } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, FileText, Search, Filter, X,
  Phone, Mail, Flame, Sun, Snowflake, Clock, AlertCircle, Eye, ChevronRight
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const TEMP_ICONS = {
  hot: { icon: Flame, color: 'text-red-500' },
  warm: { icon: Sun, color: 'text-amber-500' },
  cold: { icon: Snowflake, color: 'text-blue-400' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemp, setFilterTemp] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [previewDeal, setPreviewDeal] = useState<Deal | null>(null);
  const navigate = useNavigate();

  const COLUMNS = settings?.kanbanColumns?.sort((a, b) => a.order - b.order) || [];

  const fetchDeals = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/deals', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDeals(data);
      }
    } catch (error) {
      console.warn("Error fetching deals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [user]);

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.clientName.toLowerCase().includes(q) ||
        d.projectType.toLowerCase().includes(q) ||
        (d.phone || '').includes(q) ||
        (d.email || '').toLowerCase().includes(q) ||
        (d.company || '').toLowerCase().includes(q)
      );
    }
    if (filterTemp) {
      result = result.filter(d => d.temperature === filterTemp);
    }
    if (filterSource) {
      result = result.filter(d => d.source === filterSource);
    }
    return result;
  }, [deals, searchQuery, filterTemp, filterSource]);

  const handleCreateDeal = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const idToken = await user.getIdToken();
      const firstColumnId = COLUMNS.length > 0 ? COLUMNS[0].id : 'new';
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientName: 'Новая сделка',
          projectType: 'Разработка сайта',
          status: firstColumnId,
          amount: 0,
          source: 'manual',
          temperature: 'warm',
        })
      });

      if (response.ok) {
        const newDeal = await response.json();
        navigate(`/deal/${newDeal.id}`);
      } else {
        const errData = await response.json();
        alert(`Ошибка: ${errData.error || 'Неизвестная ошибка'}. Убедитесь, что база данных MySQL подключена и таблицы созданы (drizzle-kit push).`);
      }
    } catch (error: any) {
      console.warn("Error creating deal", error);
      alert(`Сетевая ошибка: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (!dealId || !user) return;

    const deal = deals.find(d => d.id === dealId);
    if (deal && deal.status !== targetStatus) {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: targetStatus } : d));
      try {
        const idToken = await user.getIdToken();
        await fetch(`/api/deals/${dealId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: targetStatus })
        });
      } catch (err) {
        console.warn("Error updating deal status", err);
        fetchDeals();
      }
    }
  };

  const hasActiveFilters = searchQuery || filterTemp || filterSource;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Воронка продаж</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Всего сделок: {deals.length} | Сумма: {deals.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString('ru-RU')} &#8381;
            </p>
          </div>
          <button
            onClick={handleCreateDeal}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Создание...' : 'Добавить лида'}
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, телефону, email..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filterTemp}
            onChange={e => setFilterTemp(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Все температуры</option>
            <option value="hot">Горячие</option>
            <option value="warm">Теплые</option>
            <option value="cold">Холодные</option>
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Все источники</option>
            <option value="manual">Вручную</option>
            <option value="website">С сайта</option>
            <option value="referral">По рекомендации</option>
            <option value="social">Соцсети</option>
            <option value="ads">Реклама</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(''); setFilterTemp(''); setFilterSource(''); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <X className="w-4 h-4" /> Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-5">
        {COLUMNS.map(col => {
          const colDeals = filteredDeals.filter(d => d.status === col.id);
          const colSum = colDeals.reduce((s, d) => s + (d.amount || 0), 0);

          return (
            <div
              key={col.id}
              className="flex flex-col flex-shrink-0 w-80 bg-slate-100/50 rounded-xl border border-slate-200 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 border-b border-slate-200 ${col.color.split(' ')[0]}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-sm ${col.color.split(' ')[2]}`}>{col.label}</span>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs opacity-70">{colDeals.length}</span>
                </div>
                {colSum > 0 && (
                  <p className="text-xs text-slate-500 mt-1">{colSum.toLocaleString('ru-RU')} &#8381;</p>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colDeals.map(deal => {
                  const tempInfo = TEMP_ICONS[(deal.temperature || 'warm') as keyof typeof TEMP_ICONS] || TEMP_ICONS.warm;
                  const TempIcon = tempInfo.icon;
                  const hasReminder = deal.reminderDate && isPast(new Date(deal.reminderDate));

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all group relative"
                    >
                      {/* Top row */}
                      <div className="flex justify-between items-start mb-1.5">
                        <h3
                          className="font-semibold text-slate-800 text-sm line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/deal/${deal.id}`)}
                        >
                          {deal.clientName}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <TempIcon className={`w-3.5 h-3.5 ${tempInfo.color}`} />
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewDeal(previewDeal?.id === deal.id ? null : deal); }}
                            className="text-slate-400 hover:text-blue-500 transition-colors p-0.5"
                            title="Быстрый просмотр"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{deal.projectType}</p>

                      {/* Contact badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {deal.phone && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                            <Phone className="w-3 h-3" /> {deal.phone}
                          </span>
                        )}
                        {deal.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                            <Mail className="w-3 h-3" /> {deal.email}
                          </span>
                        )}
                      </div>

                      {/* Amount */}
                      {deal.amount > 0 && (
                        <p className="text-xs font-bold text-emerald-600 mb-2">{deal.amount.toLocaleString('ru-RU')} &#8381;</p>
                      )}

                      {/* Reminder warning */}
                      {hasReminder && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <AlertCircle className="w-3 h-3" />
                          <span>{deal.reminderNote || 'Напоминание!'}</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{deal.createdAt ? format(new Date(deal.createdAt), 'd MMM', { locale: ru }) : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {deal.source === 'website' && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Сайт</span>}
                          {deal.cpData && <span className="text-blue-500 font-medium text-[10px] uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">КП</span>}
                          {deal.contractData && <span className="text-indigo-500 font-medium text-[10px] uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">Договор</span>}
                        </div>
                      </div>

                      {/* Quick Preview Popup */}
                      {previewDeal?.id === deal.id && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-slate-800">{deal.clientName}</h4>
                            <button onClick={() => setPreviewDeal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="space-y-1 text-xs text-slate-600">
                            {deal.company && <p>Компания: {deal.company}</p>}
                            {deal.phone && <p>Тел: {deal.phone}</p>}
                            {deal.email && <p>Email: {deal.email}</p>}
                            <p>Тип: {deal.projectType}</p>
                            {deal.amount > 0 && <p className="font-bold text-emerald-600">Сумма: {deal.amount.toLocaleString('ru-RU')} &#8381;</p>}
                            {deal.currentSituation && <p className="line-clamp-3 text-slate-500 mt-1">{deal.currentSituation}</p>}
                          </div>
                          <button
                            onClick={() => navigate(`/deal/${deal.id}`)}
                            className="mt-3 w-full text-center py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            Открыть карточку <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {colDeals.length === 0 && (
                  <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                    Перетащите сюда
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
