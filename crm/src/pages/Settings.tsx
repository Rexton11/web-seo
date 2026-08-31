import React, { useState } from 'react';
import { useSettings } from '../SettingsContext';
import { useAuth } from '../AuthContext';
import { Save, Building2, LayoutTemplate, Columns, Webhook } from 'lucide-react';
import clsx from 'clsx';
import { KanbanColumn } from '../types';

export default function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'agency' | 'templates' | 'kanban' | 'integrations'>('agency');
  const [saving, setSaving] = useState(false);

  // Local state for edits
  const [agencyForm, setAgencyForm] = useState({
    agencyName: '', inn: '', kpp: '', ogrn: '', directorName: '', address: '', bankAccount: '', bankName: '', bik: '', geminiProxy: ''
  });
  const [templatesForm, setTemplatesForm] = useState({
    contractTemplate: '', actTemplate: ''
  });
  const [kanbanForm, setKanbanForm] = useState<KanbanColumn[]>([]);

  React.useEffect(() => {
    if (settings) {
      setAgencyForm({
        agencyName: settings.agencyName || '',
        inn: settings.inn || '',
        kpp: settings.kpp || '',
        ogrn: settings.ogrn || '',
        directorName: settings.directorName || '',
        address: settings.address || '',
        bankAccount: settings.bankAccount || '',
        bankName: settings.bankName || '',
        bik: settings.bik || '',
        geminiProxy: settings.geminiProxy || ''
      });
      setTemplatesForm({
        contractTemplate: settings.contractTemplate || '',
        actTemplate: settings.actTemplate || ''
      });
      setKanbanForm(settings.kanbanColumns || []);
    }
  }, [settings]);

  const handleSave = async (updates: any) => {
    setSaving(true);
    await updateSettings(updates);
    setSaving(false);
    alert('Настройки сохранены');
  };

  if (loading) return <div className="flex h-full items-center justify-center bg-slate-50">Загрузка...</div>;
  if (!settings) return <div className="p-8">Требуется авторизация</div>;

  const tabs = [
    { id: 'agency', label: 'Реквизиты агентства', icon: Building2 },
    { id: 'templates', label: 'Шаблоны документов', icon: LayoutTemplate },
    { id: 'kanban', label: 'Воронка (Канбан)', icon: Columns },
    { id: 'integrations', label: 'Интеграции', icon: Webhook },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-8 py-6 bg-white border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">Настройки CRM</h1>
        <p className="text-sm text-slate-500 mt-1">Управление воронкой, реквизитами и шаблонами договоров</p>
      </div>

      <div className="flex px-8 border-b border-slate-200 bg-white">
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

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl bg-white shadow-sm rounded-xl border border-slate-200 p-6">
          
          {/* ТАБ: АГЕНТСТВО */}
          {activeTab === 'agency' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-6">Ваши юридические реквизиты</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Наименование агентства (Исполнителя)</label>
                   <input type="text" value={agencyForm.agencyName} onChange={e => setAgencyForm({...agencyForm, agencyName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ИП Иванов И.И. / ООО «Агентство»" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ИНН</label>
                   <input type="text" value={agencyForm.inn} onChange={e => setAgencyForm({...agencyForm, inn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">КПП</label>
                   <input type="text" value={agencyForm.kpp} onChange={e => setAgencyForm({...agencyForm, kpp: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ОГРН/ОГРНИП</label>
                   <input type="text" value={agencyForm.ogrn} onChange={e => setAgencyForm({...agencyForm, ogrn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ФИО подписанта (в Лице...)</label>
                   <input type="text" value={agencyForm.directorName} onChange={e => setAgencyForm({...agencyForm, directorName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Иванова Ивана Ивановича" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Юридический адрес</label>
                   <input type="text" value={agencyForm.address} onChange={e => setAgencyForm({...agencyForm, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 
                 <div className="md:col-span-2 mt-4"><h3 className="font-semibold text-slate-800">Банковские реквизиты</h3></div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Расчетный счет</label>
                   <input type="text" value={agencyForm.bankAccount} onChange={e => setAgencyForm({...agencyForm, bankAccount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">БИК</label>
                   <input type="text" value={agencyForm.bik} onChange={e => setAgencyForm({...agencyForm, bik: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Наименование банка</label>
                   <input type="text" value={agencyForm.bankName} onChange={e => setAgencyForm({...agencyForm, bankName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 
                 <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                   <h3 className="font-semibold text-slate-800">Настройки интеграций</h3>
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">HTTP Прокси для Gemini API (Опционально)</label>
                   <p className="text-xs text-slate-500 mb-2">Например: http://user:pass@170.246.55.82:9581</p>
                   <input type="text" value={agencyForm.geminiProxy} onChange={e => setAgencyForm({...agencyForm, geminiProxy: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="http://..." />
                 </div>
               </div>
               
               <div className="mt-8 flex justify-end">
                 <button onClick={() => handleSave(agencyForm)} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2">
                   <Save className="w-4 h-4" />
                   {saving ? 'Сохранение...' : 'Сохранить реквизиты'}
                 </button>
               </div>
            </div>
          )}

          {/* ТАБ: ШАБЛОНЫ */}
          {activeTab === 'templates' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Шаблоны генерации</h2>
               <p className="text-sm text-slate-500 mb-6">Здесь вы можете изменить текст договоров и актов (в формате Markdown). Переменные (например, <code>{'{{clientName}}'}</code>) будут заменены автоматически.</p>
               
               <div className="mb-6">
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Шаблон договора</label>
                 <textarea 
                   rows={12}
                   value={templatesForm.contractTemplate} 
                   onChange={e => setTemplatesForm({...templatesForm, contractTemplate: e.target.value})} 
                   className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Шаблон акта</label>
                 <textarea 
                   rows={12}
                   value={templatesForm.actTemplate} 
                   onChange={e => setTemplatesForm({...templatesForm, actTemplate: e.target.value})} 
                   className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                 />
               </div>
               
               <div className="mt-8 flex justify-end">
                 <button onClick={() => handleSave(templatesForm)} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2">
                   <Save className="w-4 h-4" />
                   {saving ? 'Сохранение...' : 'Сохранить шаблоны'}
                 </button>
               </div>
            </div>
          )}

          {/* ТАБ: КАНБАН */}
          {activeTab === 'kanban' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Этапы воронки продаж</h2>
               <p className="text-sm text-slate-500 mb-6">Настройте колонки Канбан-доски. Вы можете переименовать этапы или добавить новые.</p>
               
               <div className="space-y-3 mb-6">
                 {kanbanForm.sort((a,b)=>a.order - b.order).map((col, index) => (
                   <div key={col.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                     <div className="font-mono text-xs text-slate-400 w-6">{index + 1}.</div>
                     <input 
                       type="text" 
                       value={col.id} 
                       disabled
                       className="w-32 px-2 py-1.5 text-sm bg-slate-100 border border-transparent rounded text-slate-500" 
                     />
                     <input 
                       type="text" 
                       value={col.label} 
                       onChange={(e) => {
                         const newKanban = [...kanbanForm];
                         newKanban[index].label = e.target.value;
                         setKanbanForm(newKanban);
                       }}
                       className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none" 
                     />
                     <input 
                       type="text" 
                       value={col.color} 
                       onChange={(e) => {
                         const newKanban = [...kanbanForm];
                         newKanban[index].color = e.target.value;
                         setKanbanForm(newKanban);
                       }}
                       className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none" 
                       placeholder="Tailwind классы (bg-slate-50...)"
                     />
                     <button 
                       onClick={() => {
                         if(confirm('Удалить этап?')) setKanbanForm(kanbanForm.filter((_, i) => i !== index));
                       }}
                       className="text-red-500 text-sm hover:underline"
                     >Удалить</button>
                   </div>
                 ))}
               </div>
               
               <button 
                 onClick={() => {
                   setKanbanForm([...kanbanForm, { id: `stage_${Date.now()}`, label: 'Новый этап', color: 'bg-slate-50 border-slate-200 text-slate-700', order: kanbanForm.length }]);
                 }}
                 className="text-sm text-blue-600 font-medium hover:underline mb-8"
               >
                 + Добавить этап
               </button>

               <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button onClick={() => handleSave({ kanbanColumns: kanbanForm })} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2">
                   <Save className="w-4 h-4" />
                   {saving ? 'Сохранение...' : 'Сохранить воронку'}
                 </button>
               </div>
            </div>
          )}

          {/* ТАБ: ИНТЕГРАЦИИ */}
          {activeTab === 'integrations' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Интеграция с WordPress (Webhooks)</h2>
               <p className="text-sm text-slate-500 mb-6">Подключите ваш сайт на WordPress (или любой другой), чтобы заявки автоматически попадали в колонку «Новые».</p>
               
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6">
                 <h3 className="font-semibold text-blue-900 mb-2">Ваш уникальный Webhook URL</h3>
                 <p className="text-sm text-blue-800 mb-3">Скопируйте этот URL и вставьте его в настройки вебхуков вашей формы (например, в Elementor Pro, Contact Form 7 с плагином Webhooks или WPForms).</p>
                 <div className="flex items-center gap-2">
                   <input 
                     type="text" 
                     readOnly
                     value={`https://crm.weboptics.ru/api/webhooks/wordpress/${user?.uid}`}
                     className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded font-mono text-sm text-slate-700 outline-none"
                   />
                   <button 
                     onClick={() => {
                       navigator.clipboard.writeText(`https://crm.weboptics.ru/api/webhooks/wordpress/${user?.uid}`);
                       alert('Скопировано!');
                     }}
                     className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors text-sm"
                   >
                     Копировать
                   </button>
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="font-semibold text-slate-800">Как это работает?</h3>
                 <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                   <li>CRM автоматически распознает стандартные поля: <code>name</code>, <code>phone</code>, <code>email</code>, <code>message</code>.</li>
                   <li>Поддерживаются плагины: <strong>Elementor Pro (Action After Submit &gt; Webhook)</strong>. Просто вставьте URL выше.</li>
                   <li>Все остальные данные из формы также будут сохранены в карточке сделки в поле «Текущая ситуация».</li>
                   <li>Заявка создается мгновенно. Вам не нужно писать код.</li>
                 </ul>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
