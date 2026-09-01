import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Client, Deal, Attachment } from '../types';
import {
  ArrowLeft, Save, Phone, Mail, Building, Globe, Users, Trash2,
  Plus, FileText, FileSignature, Calendar, ChevronRight, Loader2,
  Paperclip, Download, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ClientView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [client, setClient] = useState<Client | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', source: '', notes: ''
  });

  const [legalForm, setLegalForm] = useState({
    companyName: '', inn: '', kpp: '', ogrn: '', directorName: '', address: '', bankAccount: '', bankName: '', bik: ''
  });

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      try {
        const idToken = await user.getIdToken();
        const [clientResp, dealsResp] = await Promise.all([
          fetch(`/api/clients/${id}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
          fetch(`/api/clients/${id}/deals`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        ]);
        if (clientResp.ok) {
          const c = await clientResp.json();
          if (typeof c.legalInfo === 'string') {
            try { c.legalInfo = JSON.parse(c.legalInfo); } catch (e) {}
          }
          setClient(c);
          setForm({
            name: c.name || '', company: c.company || '', phone: c.phone || '',
            email: c.email || '', source: c.source || '', notes: c.notes || ''
          });
          if (c.legalInfo) setLegalForm(c.legalInfo);
        } else {
          navigate('/clients');
        }
        if (dealsResp.ok) setDeals(await dealsResp.json());
        const attResp = await fetch(`/api/attachments?clientId=${id}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
        if (attResp.ok) setAttachments(await attResp.json());
      } catch (err) {
        console.warn(err);
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user || !id) return;
    setUploading(true);
    try {
      const idToken = await user.getIdToken();
      for (const file of Array.from(e.target.files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', id);
        await fetch('/api/attachments', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${idToken}` },
          body: formData,
        });
      }
      const attResp = await fetch(`/api/attachments?clientId=${id}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
      if (attResp.ok) setAttachments(await attResp.json());
    } catch (err) { console.warn(err); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!user || !confirm('Удалить файл?')) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    } catch (e) { console.warn(e); }
  };

  const handleDownloadAttachment = async (att: Attachment) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch(`/api/attachments/${att.id}/download`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.warn(e); }
  };

  const saveClient = async () => {
    if (!id || !user) return;
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, legalInfo: legalForm })
      });
      setClient({ ...client!, ...form, legalInfo: legalForm });
    } catch (error) {
      console.warn('Error saving client', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    if (!window.confirm('Удалить этого клиента? Сделки останутся, но будут отвязаны.')) return;
    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (resp.ok) navigate('/clients');
      else alert('Ошибка при удалении');
    } catch (e) {
      alert('Ошибка при удалении');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!id || !user || !client) return;
    setIsCreatingDeal(true);
    try {
      const idToken = await user.getIdToken();
      const firstColumnId = settings?.kanbanColumns?.sort((a, b) => a.order - b.order)[0]?.id || 'new';
      const resp = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          clientName: client.name,
          projectType: 'Новый проект',
          status: firstColumnId,
          amount: 0,
          phone: client.phone || null,
          email: client.email || null,
          company: client.company || null,
          source: client.source || 'manual',
          temperature: 'warm',
          legalInfo: client.legalInfo || null,
        })
      });
      if (resp.ok) {
        const newDeal = await resp.json();
        navigate(`/deal/${newDeal.id}`);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsCreatingDeal(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center bg-slate-50">Загрузка...</div>;
  if (!client) return null;

  const totalAmount = deals.reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{client.name}</h1>
              {client.company && <p className="text-sm text-slate-500">{client.company}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{saving ? 'Сохранение...' : ''}</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-md transition-colors text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Удалить клиента"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto">
          {/* Left: Client info */}
          <div className="flex-1 space-y-6">
            {/* Contact */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-5">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Контактная информация
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Имя / ФИО</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Компания</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ООО Ромашка" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Телефон</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+7 (___) ___-__-__" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="client@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Источник</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Не указан</option>
                    <option value="manual">Вручную</option>
                    <option value="website">С сайта</option>
                    <option value="referral">По рекомендации</option>
                    <option value="social">Соцсети</option>
                    <option value="ads">Реклама</option>
                    <option value="cold">Холодный контакт</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">Заметки</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y" placeholder="Важные детали о клиенте..." />
              </div>
            </div>

            {/* Legal info */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-5">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                Юридические реквизиты
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Полное наименование</label>
                  <input type="text" value={legalForm.companyName} onChange={e => setLegalForm({...legalForm, companyName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder='ООО "Ромашка"' />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">ИНН</label>
                  <input type="text" value={legalForm.inn} onChange={e => setLegalForm({...legalForm, inn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">КПП</label>
                  <input type="text" value={legalForm.kpp} onChange={e => setLegalForm({...legalForm, kpp: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">ОГРН</label>
                  <input type="text" value={legalForm.ogrn} onChange={e => setLegalForm({...legalForm, ogrn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Подписант</label>
                  <input type="text" value={legalForm.directorName} onChange={e => setLegalForm({...legalForm, directorName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ген. директор Иванов И.И." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Юридический адрес</label>
                  <input type="text" value={legalForm.address} onChange={e => setLegalForm({...legalForm, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Расчетный счет</label>
                  <input type="text" value={legalForm.bankAccount} onChange={e => setLegalForm({...legalForm, bankAccount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">БИК</label>
                  <input type="text" value={legalForm.bik} onChange={e => setLegalForm({...legalForm, bik: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Банк</label>
                  <input type="text" value={legalForm.bankName} onChange={e => setLegalForm({...legalForm, bankName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-5">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-600" />
                Файлы клиента
              </h2>
              <div className="space-y-2 mb-4">
                {attachments.length === 0 && (
                  <p className="text-sm text-slate-400">Нет прикрепленных файлов</p>
                )}
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 truncate">{att.originalName}</p>
                        <p className="text-xs text-slate-400">{(att.size / 1024).toFixed(0)} КБ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => handleDownloadAttachment(att)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Скачать">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? 'Загрузка...' : 'Прикрепить файл'}
                <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div className="flex justify-end">
              <button onClick={saveClient} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>

          {/* Right: Deals */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden sticky top-4">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Сделки
                  </h2>
                  {totalAmount > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      Итого: {totalAmount.toLocaleString('ru-RU')} &#8381;
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCreateDeal}
                  disabled={isCreatingDeal}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Новая сделка
                </button>
              </div>

              <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                {deals.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-400">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    Нет сделок
                  </div>
                )}
                {deals.map(deal => {
                  const stageLabel = settings?.kanbanColumns?.find(c => c.id === deal.status)?.label || deal.status;
                  return (
                    <div
                      key={deal.id}
                      onClick={() => navigate(`/deal/${deal.id}`)}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {deal.projectType || 'Без типа'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{stageLabel}</span>
                            {deal.amount > 0 && (
                              <span className="text-xs font-semibold text-emerald-600">{deal.amount.toLocaleString('ru-RU')} &#8381;</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs text-slate-400">
                            {deal.createdAt ? format(new Date(deal.createdAt), 'd MMM yy', { locale: ru }) : ''}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        {deal.cpData && <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">КП</span>}
                        {deal.contractData && <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-medium">Договор</span>}
                        {deal.actData && <span className="text-[10px] bg-emerald-50 text-emerald-500 px-1.5 py-0.5 rounded font-medium">Акт</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
