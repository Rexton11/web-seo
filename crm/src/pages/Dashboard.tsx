import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Deal, KanbanColumn } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Calendar, FileText, Settings as SettingsIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const COLUMNS = settings?.kanbanColumns?.sort((a,b)=>a.order - b.order) || [];

  const fetchDeals = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/deals', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Sort by createdAt descending locally
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

  const handleCreateDeal = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const idToken = await user.getIdToken();
      // Ищем ID первой колонки, чтобы сделка точно попала в начало
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
          currentSituation: '',
          businessGoals: '',
          growthPoints: '',
        })
      });
      
      if (response.ok) {
        const newDeal = await response.json();
        navigate(`/deal/${newDeal.id}`);
      } else {
        const errData = await response.json();
        alert(`Ошибка сервера при создании сделки: ${errData.error || 'Неизвестная ошибка'}. Убедитесь, что база данных MySQL подключена и таблицы созданы (drizzle-kit push).`);
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
      // Optimistic update
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
        // Rollback on error
        fetchDeals();
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Воронка продаж (Канбан)</h2>
          <p className="text-sm text-slate-500 mt-1">Перетаскивайте карточки для смены статуса. Администраторский доступ готов к подключению команды.</p>
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

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-6">
        {COLUMNS.map(col => {
          const colDeals = deals.filter(d => d.status === col.id);
          return (
            <div 
              key={col.id} 
              className="flex flex-col flex-shrink-0 w-80 bg-slate-100/50 rounded-xl border border-slate-200 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`px-4 py-3 border-b border-slate-200 font-semibold text-sm flex items-center justify-between ${col.color.split(' ')[0]}`}>
                <span className={col.color.split(' ')[2]}>{col.label}</span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs opacity-70">{colDeals.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colDeals.map(deal => (
                  <div 
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800 text-sm line-clamp-2" onClick={() => navigate(`/deal/${deal.id}`)}>{deal.clientName}</h3>
                      <button onClick={() => navigate(`/deal/${deal.id}`)} className="text-slate-400 hover:text-blue-500 transition-colors">
                        <SettingsIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-3 line-clamp-1">{deal.projectType}</p>
                    
                    {col.id === 'need_cp' && (
                      <button 
                        onClick={() => navigate(`/deal/${deal.id}`)}
                        className="w-full mb-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Сгенерировать КП
                      </button>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{deal.createdAt ? format(new Date((deal.createdAt as any)?.toDate?.() || Date.now()), 'd MMM', { locale: ru }) : ''}</span>
                      </div>
                      {deal.cpData && <span className="text-blue-500 font-medium text-[10px] uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">КП готово</span>}
                    </div>
                  </div>
                ))}
                
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
