import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Deal, CPFormData, GenerateResponse, Activity } from '../types';
import {
  ArrowLeft, Save, FileText, FileSignature, FileCheck, Building2,
  Phone, Mail, Building, Globe, Thermometer, Clock, MessageSquare,
  Plus, Send, PhoneCall, CalendarCheck, Users, ChevronRight, BookOpen,
  Flame, Snowflake, Sun, AlertCircle, Loader2, Trash2
} from 'lucide-react';
import clsx from 'clsx';
import CPForm from '../components/CPForm';
import CPPreview from '../components/CPPreview';

const ACTIVITY_ICONS: Record<string, any> = {
  call: PhoneCall,
  email_sent: Send,
  meeting: Users,
  cp_sent: FileText,
  note: MessageSquare,
  status_change: ChevronRight,
  created: Plus,
  reminder: Clock,
};

const ACTIVITY_LABELS: Record<string, string> = {
  call: 'Звонок',
  email_sent: 'Email отправлен',
  meeting: 'Встреча',
  cp_sent: 'КП отправлено',
  note: 'Заметка',
  status_change: 'Смена статуса',
  created: 'Создано',
  reminder: 'Напоминание',
};

const TEMP_CONFIG = {
  hot: { icon: Flame, label: 'Горячий', color: 'text-red-500 bg-red-50 border-red-200' },
  warm: { icon: Sun, label: 'Теплый', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  cold: { icon: Snowflake, label: 'Холодный', color: 'text-blue-400 bg-blue-50 border-blue-200' },
};

export default function DealView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'cp' | 'legal' | 'contract' | 'act'>('card');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showScript, setShowScript] = useState(false);

  const [legalForm, setLegalForm] = useState({
    companyName: '', inn: '', kpp: '', ogrn: '', directorName: '', address: '', bankAccount: '', bankName: '', bik: ''
  });

  // Editable deal fields
  const [editForm, setEditForm] = useState({
    clientName: '', projectType: '', phone: '', email: '', company: '', source: '',
    amount: 0, temperature: 'warm' as string, reminderDate: '', reminderNote: '',
    currentSituation: '', businessGoals: '', growthPoints: ''
  });

  useEffect(() => {
    if (!id || !user) return;
    const fetchDeal = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/deals/${id}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
          const d = await response.json();
          if (typeof d.legalInfo === 'string') {
            try { d.legalInfo = JSON.parse(d.legalInfo); } catch (e) {}
          }
          setDeal(d);
          if (d.legalInfo) setLegalForm(d.legalInfo);
          setEditForm({
            clientName: d.clientName || '',
            projectType: d.projectType || '',
            phone: d.phone || '',
            email: d.email || '',
            company: d.company || '',
            source: d.source || 'manual',
            amount: d.amount || 0,
            temperature: d.temperature || 'warm',
            reminderDate: d.reminderDate || '',
            reminderNote: d.reminderNote || '',
            currentSituation: d.currentSituation || '',
            businessGoals: d.businessGoals || '',
            growthPoints: d.growthPoints || '',
          });
        } else {
          navigate('/');
        }
      } catch (err) {
        console.warn(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDeal();
    fetchActivities();
  }, [id, user]);

  const fetchActivities = async () => {
    if (!id || !user) return;
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch(`/api/deals/${id}/activities`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (resp.ok) {
        setActivities(await resp.json());
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const saveDeal = async (updates: Partial<Deal>) => {
    if (!id || !deal || !user) return;
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        setDeal({ ...deal, ...updates });
      }
    } catch (error) {
      console.warn("Error saving deal", error);
    } finally {
      setSaving(false);
    }
  };

  const saveCardForm = async () => {
    await saveDeal(editForm as any);
  };

  const addActivity = async (type: string, text: string) => {
    if (!id || !user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/deals/${id}/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, text })
      });
      fetchActivities();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleQuickAction = async (type: string) => {
    const label = ACTIVITY_LABELS[type] || type;
    await addActivity(type, label);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addActivity('note', newNote.trim());
    setNewNote('');
  };

  const handleGenerateCP = async (formData: CPFormData) => {
    setIsGenerating(true);
    await saveDeal({
      clientName: formData.clientName,
      projectType: formData.projectType,
      currentSituation: formData.currentSituation,
      businessGoals: formData.businessGoals,
      growthPoints: formData.growthPoints,
    });
    try {
      const response = await fetch('/api/generate-cp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, proxy: settings?.geminiProxy }),
      });
      if (!response.ok) throw new Error('Failed to generate CP');
      const resultData: GenerateResponse = await response.json();
      await saveDeal({ cpData: resultData.result, status: (deal?.status === 'new' || deal?.status === 'need_cp') ? 'cp_sent' : deal?.status });
      await addActivity('cp_sent', 'КП сгенерировано и сохранено');
    } catch (error) {
      console.warn(error);
      alert('Ошибка при генерации КП.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!id || !user) return;
    if (!window.confirm('Удалить эту сделку? Это действие нельзя отменить.')) return;
    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/deals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (response.ok) {
        navigate('/');
      } else {
        alert('Ошибка при удалении сделки');
      }
    } catch (error) {
      console.warn("Error deleting deal", error);
      alert('Ошибка при удалении сделки');
    } finally {
      setIsDeleting(false);
    }
  };

  const saveLegalInfo = async () => {
    await saveDeal({ legalInfo: legalForm });
  };

  const generateLocalDoc = (template: string) => {
    if (!settings || !deal) return '';
    const legal = deal.legalInfo || {} as any;
    return template
      .replace(/{{dealId}}/g, deal.id)
      .replace(/{{clientName}}/g, legal.companyName || deal.clientName || '_______________')
      .replace(/{{clientInn}}/g, legal.inn || '_______________')
      .replace(/{{clientKpp}}/g, legal.kpp || '_______________')
      .replace(/{{clientOgrn}}/g, legal.ogrn || '_______________')
      .replace(/{{clientDirector}}/g, legal.directorName || '_______________')
      .replace(/{{clientAddress}}/g, legal.address || '_______________')
      .replace(/{{clientAccount}}/g, legal.bankAccount || '_______________')
      .replace(/{{clientBank}}/g, legal.bankName || '_______________')
      .replace(/{{clientBik}}/g, legal.bik || '_______________')
      .replace(/{{projectType}}/g, deal.projectType || '_______________')
      .replace(/{{dealAmount}}/g, String(deal.amount || '_______________'))
      .replace(/{{agencyName}}/g, settings.agencyName || '_______________')
      .replace(/{{agencyInn}}/g, settings.inn || '_______________')
      .replace(/{{agencyKpp}}/g, settings.kpp || '_______________')
      .replace(/{{agencyOgrn}}/g, settings.ogrn || '_______________')
      .replace(/{{agencyDirector}}/g, settings.directorName || '_______________')
      .replace(/{{agencyAddress}}/g, settings.address || '_______________')
      .replace(/{{agencyAccount}}/g, settings.bankAccount || '_______________')
      .replace(/{{agencyBank}}/g, settings.bankName || '_______________')
      .replace(/{{agencyBik}}/g, settings.bik || '_______________');
  };

  const handleGenerateContract = async () => {
    if (!settings?.contractTemplate) return alert('Шаблон договора не настроен');
    setSaving(true);
    const content = generateLocalDoc(settings.contractTemplate);
    await saveDeal({ contractData: content, status: 'contract_signed' });
    await addActivity('status_change', 'Договор сформирован');
    setSaving(false);
  };

  const handleGenerateAct = async () => {
    if (!settings?.actTemplate) return alert('Шаблон акта не настроен');
    setSaving(true);
    const content = generateLocalDoc(settings.actTemplate);
    await saveDeal({ actData: content });
    await addActivity('status_change', 'Акт сформирован');
    setSaving(false);
  };

  if (loading) return <div className="flex h-full items-center justify-center bg-slate-50">Загрузка сделки...</div>;
  if (!deal) return null;

  const currentScript = settings?.stageScripts?.find(s => s.stageId === deal.status);
  const currentStageLabel = settings?.kanbanColumns?.find(c => c.id === deal.status)?.label || deal.status;
  const tempConfig = TEMP_CONFIG[(deal.temperature || 'warm') as keyof typeof TEMP_CONFIG] || TEMP_CONFIG.warm;
  const TempIcon = tempConfig.icon;

  const tabs = [
    { id: 'card', label: 'Карточка', icon: Building2 },
    { id: 'cp', label: 'КП', icon: FileText },
    { id: 'legal', label: 'Реквизиты', icon: Building2 },
    { id: 'contract', label: 'Договор', icon: FileSignature },
    { id: 'act', label: 'Акт', icon: FileCheck },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{deal.clientName || 'Новая сделка'}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{deal.projectType}</span>
                {deal.source && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{deal.source === 'website' ? 'С сайта' : deal.source === 'manual' ? 'Вручную' : deal.source}</span>}
              </div>
            </div>
            <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium', tempConfig.color)}>
              <TempIcon className="w-3.5 h-3.5" />
              {tempConfig.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deal.amount > 0 && (
            <span className="text-sm font-bold text-emerald-600">{deal.amount.toLocaleString('ru-RU')} &#8381;</span>
          )}
          <span className="text-xs text-slate-400 mr-2">{saving ? 'Сохранение...' : ''}</span>
          <select
            value={deal.status}
            onChange={async (e) => {
              const newStatus = e.target.value;
              await saveDeal({ status: newStatus });
              await addActivity('status_change', `Статус изменен: ${currentStageLabel} → ${settings?.kanbanColumns?.find(c => c.id === newStatus)?.label || newStatus}`);
            }}
            className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {settings?.kanbanColumns?.map(col => (
              <option key={col.id} value={col.id}>{col.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowScript(!showScript)}
            className={clsx(
              "p-2 rounded-md transition-colors",
              showScript ? "bg-blue-100 text-blue-600" : "hover:bg-slate-100 text-slate-500"
            )}
            title="Скрипт продаж"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={handleDeleteDeal}
            disabled={isDeleting}
            className="p-2 rounded-md transition-colors text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Удалить сделку"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sales Script Panel */}
      {showScript && currentScript && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Скрипт: {currentStageLabel}</h3>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-sans">{currentScript.script}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex px-6 border-b border-slate-200 bg-white overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors outline-none whitespace-nowrap",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* TAB: DEAL CARD */}
        {activeTab === 'card' && (
          <div className="h-full overflow-y-auto">
            <div className="flex flex-col lg:flex-row gap-6 p-6">
              {/* Left: Contact Info + Details */}
              <div className="flex-1 space-y-6">
                {/* Contact Info */}
                <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-5">
                  <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Контактная информация
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Имя клиента / Компания</label>
                      <input type="text" value={editForm.clientName} onChange={e => setEditForm({...editForm, clientName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Компания</label>
                      <input type="text" value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ООО Ромашка" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Телефон</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+7 (___) ___-__-__" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="client@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Тип проекта</label>
                      <input type="text" value={editForm.projectType} onChange={e => setEditForm({...editForm, projectType: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Сумма сделки, &#8381;</label>
                      <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Источник</label>
                      <select value={editForm.source} onChange={e => setEditForm({...editForm, source: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="manual">Вручную</option>
                        <option value="website">С сайта</option>
                        <option value="referral">По рекомендации</option>
                        <option value="social">Соцсети</option>
                        <option value="ads">Реклама</option>
                        <option value="cold">Холодный контакт</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Температура</label>
                      <select value={editForm.temperature} onChange={e => setEditForm({...editForm, temperature: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="hot">Горячий</option>
                        <option value="warm">Теплый</option>
                        <option value="cold">Холодный</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reminder */}
                <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-5">
                  <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Напоминание
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Дата напоминания</label>
                      <input type="datetime-local" value={editForm.reminderDate} onChange={e => setEditForm({...editForm, reminderDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Примечание</label>
                      <input type="text" value={editForm.reminderNote} onChange={e => setEditForm({...editForm, reminderNote: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Перезвонить по КП" />
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-5">
                  <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Комментарий
                  </h2>
                  <textarea
                    rows={4}
                    value={editForm.currentSituation}
                    onChange={e => setEditForm({...editForm, currentSituation: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    placeholder="Заметки по сделке, пожелания клиента, важные детали..."
                  />
                </div>

                <div className="flex justify-end">
                  <button onClick={saveCardForm} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {saving ? 'Сохранение...' : 'Сохранить карточку'}
                  </button>
                </div>
              </div>

              {/* Right: Activity Feed */}
              <div className="w-full lg:w-96 flex-shrink-0">
                <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden sticky top-4">
                  <div className="p-4 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Активность
                    </h2>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-3 border-b border-slate-100 flex flex-wrap gap-2">
                    <button onClick={() => handleQuickAction('call')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                      <PhoneCall className="w-3.5 h-3.5" /> Звонок
                    </button>
                    <button onClick={() => handleQuickAction('email_sent')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">
                      <Send className="w-3.5 h-3.5" /> Email
                    </button>
                    <button onClick={() => handleQuickAction('meeting')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors">
                      <Users className="w-3.5 h-3.5" /> Встреча
                    </button>
                  </div>

                  {/* Add Note */}
                  <div className="p-3 border-b border-slate-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                        placeholder="Добавить заметку..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button onClick={handleAddNote} disabled={!newNote.trim()} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Activity List */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {activities.length === 0 && (
                      <div className="p-6 text-center text-sm text-slate-400">Нет записей</div>
                    )}
                    {activities.map(act => {
                      const Icon = ACTIVITY_ICONS[act.type] || MessageSquare;
                      return (
                        <div key={act.id} className="px-4 py-3 flex gap-3">
                          <div className="mt-0.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">{act.text}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {act.createdAt ? new Date(act.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LEGAL */}
        {activeTab === 'legal' && (
          <div className="h-full overflow-y-auto p-6 flex justify-center">
            <div className="w-full max-w-2xl bg-white shadow-sm rounded-xl border border-slate-200 p-6">
               <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-blue-600" />
                 Юридические реквизиты клиента
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Полное наименование компании</label>
                   <input type="text" value={legalForm.companyName} onChange={e => setLegalForm({...legalForm, companyName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ООО «Ромашка»" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ИНН</label>
                   <input type="text" value={legalForm.inn} onChange={e => setLegalForm({...legalForm, inn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">КПП</label>
                   <input type="text" value={legalForm.kpp} onChange={e => setLegalForm({...legalForm, kpp: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ОГРН</label>
                   <input type="text" value={legalForm.ogrn} onChange={e => setLegalForm({...legalForm, ogrn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ФИО и должность подписанта</label>
                   <input type="text" value={legalForm.directorName} onChange={e => setLegalForm({...legalForm, directorName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Генеральный директор Иванов И.И." />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Юридический адрес</label>
                   <input type="text" value={legalForm.address} onChange={e => setLegalForm({...legalForm, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div className="md:col-span-2"><h3 className="font-semibold text-slate-800 mt-4 mb-2">Банковские реквизиты</h3></div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Расчетный счет</label>
                   <input type="text" value={legalForm.bankAccount} onChange={e => setLegalForm({...legalForm, bankAccount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">БИК</label>
                   <input type="text" value={legalForm.bik} onChange={e => setLegalForm({...legalForm, bik: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Наименование банка</label>
                   <input type="text" value={legalForm.bankName} onChange={e => setLegalForm({...legalForm, bankName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
               </div>
               <div className="mt-8 flex justify-end">
                 <button onClick={saveLegalInfo} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2">
                   <Save className="w-4 h-4" />
                   Сохранить реквизиты
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* TAB: КП (форма + результат) */}
        {activeTab === 'cp' && (
          <div className="h-full overflow-y-auto">
            <div className="p-6 flex justify-center">
              <div className="w-full max-w-2xl bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <CPForm
                  initialData={{
                    clientName: deal.clientName,
                    projectType: deal.projectType,
                    currentSituation: deal.currentSituation,
                    businessGoals: deal.businessGoals,
                    growthPoints: deal.growthPoints,
                  }}
                  onGenerate={handleGenerateCP}
                  isLoading={isGenerating}
                  buttonText="Сгенерировать КП"
                />
              </div>
            </div>
            {deal.cpData && (
              <div className="border-t border-slate-200">
                <CPPreview
                  content={deal.cpData}
                  onChange={(newContent) => saveDeal({ cpData: newContent })}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB: CONTRACT */}
        {activeTab === 'contract' && (
          <div className="h-full overflow-y-auto">
            {deal.contractData ? (
              <CPPreview
                content={deal.contractData}
                onChange={(newContent) => saveDeal({ contractData: newContent })}
              />
            ) : (
              <div className="h-full p-6 flex flex-col items-center justify-center">
                <FileSignature className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">Генератор Договоров</h2>
                <p className="text-slate-500 mb-6 max-w-md text-center">Договор формируется с учетом реквизитов клиента и ваших данных из раздела «Настройки».</p>
                <button
                  onClick={handleGenerateContract}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                  {saving ? 'Формирование...' : 'Сформировать договор'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: ACT */}
        {activeTab === 'act' && (
          <div className="h-full overflow-y-auto">
            {deal.actData ? (
              <CPPreview
                content={deal.actData}
                onChange={(newContent) => saveDeal({ actData: newContent })}
              />
            ) : (
              <div className="h-full p-6 flex flex-col items-center justify-center">
                <FileCheck className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">Акты выполненных работ</h2>
                <p className="text-slate-500 mb-6 max-w-md text-center">Закройте этап или проект актом, который можно скачать в PDF.</p>
                <button
                  onClick={handleGenerateAct}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                  {saving ? 'Формирование...' : 'Сформировать акт'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
