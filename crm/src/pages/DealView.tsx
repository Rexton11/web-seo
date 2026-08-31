import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Deal, CPFormData, GenerateResponse } from '../types';
import { ArrowLeft, Check, FileText, Settings, Briefcase, FileSignature, FileCheck, Building2, Save } from 'lucide-react';
import clsx from 'clsx';
import CPForm from '../components/CPForm';
import CPPreview from '../components/CPPreview';
import { generatePDF } from '../utils/pdf';

export default function DealView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'legal' | 'cp' | 'contract' | 'act'>('info');

  const [isGenerating, setIsGenerating] = useState(false);

  // Legal form state
  const [legalForm, setLegalForm] = useState({
    companyName: '', inn: '', kpp: '', ogrn: '', directorName: '', address: '', bankAccount: '', bankName: '', bik: ''
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
          const fetchedDeal = await response.json();
          // parse json fields if needed
          if (typeof fetchedDeal.legalInfo === 'string') {
            try { fetchedDeal.legalInfo = JSON.parse(fetchedDeal.legalInfo); } catch (e) {}
          }
          setDeal(fetchedDeal);
          if (fetchedDeal.legalInfo) {
            setLegalForm(fetchedDeal.legalInfo);
          }
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
  }, [id, user, navigate]);

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

  const handleGenerateCP = async (formData: CPFormData) => {
    setIsGenerating(true);
    // Save discovery data first
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
      setActiveTab('cp');
    } catch (error) {
      console.warn(error);
      alert('Ошибка при генерации КП.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveLegalInfo = async () => {
    await saveDeal({ legalInfo: legalForm });
    alert('Реквизиты сохранены');
  };

  const generateLocalDoc = (template: string) => {
    if (!settings || !deal) return '';
    const legal = deal.legalInfo || {};
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
      .replace(/{{dealAmount}}/g, deal.budget || '_______________')
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
    setSaving(false);
  };

  const handleGenerateAct = async () => {
    if (!settings?.actTemplate) return alert('Шаблон акта не настроен');
    setSaving(true);
    const content = generateLocalDoc(settings.actTemplate);
    await saveDeal({ actData: content });
    setSaving(false);
  };

  if (loading) return <div className="flex h-full items-center justify-center bg-slate-50">Загрузка сделки...</div>;
  if (!deal) return null;

  const tabs = [
    { id: 'info', label: 'Discovery', icon: Settings },
    { id: 'legal', label: 'Реквизиты', icon: Building2 },
    { id: 'cp', label: 'КП', icon: FileText },
    { id: 'contract', label: 'Договор', icon: FileSignature },
    { id: 'act', label: 'Акт', icon: FileCheck },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{deal.clientName || 'Новая сделка'}</h1>
            <p className="text-sm text-slate-500">{deal.projectType}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 mr-2">{saving ? 'Сохранение...' : 'Сохранено'}</span>
          <select 
            value={deal.status}
            onChange={(e) => saveDeal({ status: e.target.value as Deal['status'] })}
            className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {settings?.kanbanColumns?.map(col => (
              <option key={col.id} value={col.id}>{col.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex px-6 border-b border-slate-200 bg-white">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors outline-none",
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

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'info' && (
          <div className="h-full overflow-y-auto p-6 flex justify-center">
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
        )}

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
                 <div className="md:col-span-2">
                   <h3 className="font-semibold text-slate-800 mt-4 mb-2">Банковские реквизиты</h3>
                 </div>
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

        {activeTab === 'cp' && (
          <div className="h-full relative shadow-inner overflow-hidden">
            <CPPreview 
              content={deal.cpData || ''} 
              onChange={(newContent) => saveDeal({ cpData: newContent })} 
            />
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="h-full relative shadow-inner overflow-hidden">
            {deal.contractData ? (
              <CPPreview 
                content={deal.contractData} 
                onChange={(newContent) => saveDeal({ contractData: newContent })} 
              />
            ) : (
              <div className="h-full overflow-y-auto p-6 flex flex-col items-center justify-center">
                <FileSignature className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">Генератор Договоров</h2>
                <p className="text-slate-500 mb-6 max-w-md text-center">Договор формируется с учетом сохраненных реквизитов клиента из вкладки «Реквизиты» и ваших данных из раздела «Настройки».</p>
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

        {activeTab === 'act' && (
          <div className="h-full relative shadow-inner overflow-hidden">
            {deal.actData ? (
              <CPPreview 
                content={deal.actData} 
                onChange={(newContent) => saveDeal({ actData: newContent })} 
              />
            ) : (
              <div className="h-full overflow-y-auto p-6 flex flex-col items-center justify-center">
                <FileCheck className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">Акты выполненных работ</h2>
                <p className="text-slate-500 mb-6 max-w-md text-center">Закройте этап или проект актом, который можно скачать в PDF. В акт автоматически подтянутся реквизиты.</p>
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
