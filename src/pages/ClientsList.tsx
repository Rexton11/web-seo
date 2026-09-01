import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Client } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, Building, Calendar, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ClientsList() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchClients = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (response.ok) setClients(await response.json());
    } catch (error) {
      console.warn('Error fetching clients', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [user]);

  const handleCreateClient = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Новый клиент' })
      });
      if (response.ok) {
        const newClient = await response.json();
        navigate(`/client/${newClient.id}`);
      }
    } catch (error) {
      console.warn('Error creating client', error);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = searchQuery.trim()
    ? clients.filter(c => {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) ||
          (c.company || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.email || '').toLowerCase().includes(q);
      })
    : clients;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Клиенты</h2>
            <p className="text-sm text-slate-500 mt-0.5">Всего: {clients.length}</p>
          </div>
          <button
            onClick={handleCreateClient}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Создание...' : 'Добавить клиента'}
          </button>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, компании, телефону..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-12 text-slate-400">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">
              {searchQuery ? 'Ничего не найдено' : 'Пока нет клиентов'}
            </p>
            {!searchQuery && (
              <p className="text-sm mt-1">Нажмите «Добавить клиента» или создайте сделку — клиент появится автоматически</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {filtered.map(client => (
              <div
                key={client.id}
                onClick={() => navigate(`/client/${client.id}`)}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{client.name}</h3>
                      {client.company && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" /> {client.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 mt-1 transition-colors" />
                </div>

                <div className="space-y-1.5">
                  {client.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {client.phone}
                    </p>
                  )}
                  {client.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {client.email}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {client.createdAt ? format(new Date(client.createdAt), 'd MMM yyyy', { locale: ru }) : ''}
                  </span>
                  {client.source && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                      {client.source === 'website' ? 'С сайта' : client.source === 'manual' ? 'Вручную' : client.source}
                    </span>
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
