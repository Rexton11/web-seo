import React, { useState } from 'react';
import { useSettings } from '../SettingsContext';
import { useAuth } from '../AuthContext';
import { Save, Building2, LayoutTemplate, Columns, Webhook, BookOpen, Briefcase, Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';
import { KanbanColumn, StageScript, ServiceType } from '../types';

export default function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'agency' | 'services' | 'templates' | 'kanban' | 'scripts' | 'integrations'>('agency');
  const [saving, setSaving] = useState(false);

  const [agencyForm, setAgencyForm] = useState({
    agencyName: '', inn: '', kpp: '', ogrn: '', directorName: '', address: '', bankAccount: '', bankName: '', bik: '', geminiProxy: ''
  });
  const [templatesForm, setTemplatesForm] = useState({
    contractTemplate: '', actTemplate: ''
  });
  const [kanbanForm, setKanbanForm] = useState<KanbanColumn[]>([]);
  const [scriptsForm, setScriptsForm] = useState<StageScript[]>([]);
  const [servicesForm, setServicesForm] = useState<ServiceType[]>([]);

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
      setScriptsForm(settings.stageScripts || []);
      setServicesForm(settings.services || []);
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
    { id: 'agency', label: 'Реквизиты', icon: Building2 },
    { id: 'services', label: 'Услуги', icon: Briefcase },
    { id: 'templates', label: 'Шаблоны', icon: LayoutTemplate },
    { id: 'kanban', label: 'Воронка', icon: Columns },
    { id: 'scripts', label: 'Скрипты продаж', icon: BookOpen },
    { id: 'integrations', label: 'Интеграции', icon: Webhook },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-8 py-6 bg-white border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">Настройки CRM</h1>
        <p className="text-sm text-slate-500 mt-1">Воронка, скрипты продаж, реквизиты и шаблоны</p>
      </div>

      <div className="flex px-8 border-b border-slate-200 bg-white overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors outline-none whitespace-nowrap",
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
                   <label className="block text-sm font-medium text-slate-700 mb-1">ФИО подписанта</label>
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

          {activeTab === 'services' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Каталог услуг</h2>
               <p className="text-sm text-slate-500 mb-6">Услуги, которые можно выбрать при создании сделки. Привязка к шаблону КП опциональна.</p>
               <div className="space-y-3 mb-6">
                 {servicesForm.map((svc, index) => (
                   <div key={svc.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                     <div className="font-mono text-xs text-slate-400 w-6">{index + 1}.</div>
                     <input
                       type="text"
                       value={svc.name}
                       onChange={(e) => {
                         const updated = [...servicesForm];
                         updated[index] = { ...updated[index], name: e.target.value };
                         setServicesForm(updated);
                       }}
                       className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none"
                       placeholder="Название услуги"
                     />
                     <select
                       value={svc.cpTemplate || ''}
                       onChange={(e) => {
                         const updated = [...servicesForm];
                         updated[index] = { ...updated[index], cpTemplate: e.target.value || undefined };
                         setServicesForm(updated);
                       }}
                       className="w-48 px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none"
                     >
                       <option value="">Без шаблона КП</option>
                       <option value="website">Разработка сайта</option>
                       <option value="seo">SEO</option>
                       <option value="context_ads">Контекстная реклама</option>
                       <option value="redesign">Редизайн</option>
                       <option value="support">Техподдержка</option>
                       <option value="complex">Комплекс</option>
                     </select>
                     <button
                       onClick={() => {
                         if(confirm('Удалить услугу?')) setServicesForm(servicesForm.filter((_, i) => i !== index));
                       }}
                       className="text-red-500 hover:text-red-700 transition-colors p-1"
                     ><Trash2 className="w-4 h-4" /></button>
                   </div>
                 ))}
               </div>
               <button
                 onClick={() => {
                   setServicesForm([...servicesForm, { id: `svc_${Date.now()}`, name: '' }]);
                 }}
                 className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline mb-8"
               >
                 <Plus className="w-4 h-4" /> Добавить услугу
               </button>
               <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button onClick={() => handleSave({ services: servicesForm })} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2">
                   <Save className="w-4 h-4" />
                   {saving ? 'Сохранение...' : 'Сохранить услуги'}
                 </button>
               </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Шаблоны генерации</h2>
               <p className="text-sm text-slate-500 mb-6">Текст договоров и актов в формате Markdown. Переменные (<code>{'{{clientName}}'}</code>) заменяются автоматически.</p>
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

          {activeTab === 'kanban' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Этапы воронки продаж</h2>
               <p className="text-sm text-slate-500 mb-6">Настройте колонки Канбан-доски.</p>
               <div className="space-y-3 mb-6">
                 {kanbanForm.sort((a,b)=>a.order - b.order).map((col, index) => (
                   <div key={col.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                     <div className="font-mono text-xs text-slate-400 w-6">{index + 1}.</div>
                     <input type="text" value={col.id} disabled className="w-32 px-2 py-1.5 text-sm bg-slate-100 border border-transparent rounded text-slate-500" />
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
                       placeholder="Tailwind классы"
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

          {activeTab === 'scripts' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Скрипты продаж по этапам</h2>
               <p className="text-sm text-slate-500 mb-6">Для каждого этапа воронки задайте скрипт, который будет доступен менеджеру прямо в карточке сделки.</p>

               <div className="space-y-6">
                 {(settings?.kanbanColumns || []).sort((a, b) => a.order - b.order).map(col => {
                   const existing = scriptsForm.find(s => s.stageId === col.id);
                   return (
                     <div key={col.id} className="border border-slate-200 rounded-lg overflow-hidden">
                       <div className={`px-4 py-2.5 ${col.color.split(' ')[0]} border-b border-slate-200`}>
                         <span className={`font-semibold text-sm ${col.color.split(' ')[2]}`}>{col.label}</span>
                         <span className="text-xs text-slate-400 ml-2">({col.id})</span>
                       </div>
                       <div className="p-4">
                         <textarea
                           rows={6}
                           value={existing?.script || ''}
                           onChange={(e) => {
                             const newScripts = scriptsForm.filter(s => s.stageId !== col.id);
                             newScripts.push({ stageId: col.id, script: e.target.value });
                             setScriptsForm(newScripts);
                           }}
                           placeholder="Введите скрипт продаж для этого этапа...&#10;1. Шаг первый&#10;2. Шаг второй&#10;3. ..."
                           className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y font-mono"
                         />
                       </div>
                     </div>
                   );
                 })}
               </div>

               <div className="mt-8 flex justify-end">
                 <button onClick={() => handleSave({ stageScripts: scriptsForm })} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2">
                   <Save className="w-4 h-4" />
                   {saving ? 'Сохранение...' : 'Сохранить скрипты'}
                 </button>
               </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-2">Интеграция с сайтом (Webhook)</h2>
               <p className="text-sm text-slate-500 mb-6">Заявки с вашего сайта автоматически попадают в CRM. Поддерживается любая форма, которая умеет отправлять POST-запрос (webhook).</p>

               {/* Webhook URL */}
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6">
                 <h3 className="font-semibold text-blue-900 mb-2">Ваш Webhook URL</h3>
                 <p className="text-sm text-blue-800 mb-3">Вставьте этот URL в настройки вебхука вашей формы. Метод: <strong>POST</strong>, формат: <strong>JSON</strong>.</p>
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

               {/* Mapping Table */}
               <div className="mb-8">
                 <h3 className="font-semibold text-slate-800 mb-3">Маппинг полей формы → CRM</h3>
                 <p className="text-sm text-slate-500 mb-3">CRM автоматически распознает следующие имена полей. Используйте эти <code>name</code>-атрибуты в вашей форме:</p>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="text-left px-4 py-2 font-semibold text-slate-700 border-b border-slate-200">Поле CRM</th>
                         <th className="text-left px-4 py-2 font-semibold text-slate-700 border-b border-slate-200">Принимаемые name-атрибуты</th>
                         <th className="text-left px-4 py-2 font-semibold text-slate-700 border-b border-slate-200">Пример</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr className="border-b border-slate-100">
                         <td className="px-4 py-2 font-medium text-slate-800">Имя клиента</td>
                         <td className="px-4 py-2"><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">name</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">client_name</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">fullname</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your_name</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your-name</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">title</code></td>
                         <td className="px-4 py-2 text-slate-500">Иван Петров</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="px-4 py-2 font-medium text-slate-800">Телефон</td>
                         <td className="px-4 py-2"><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">phone</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your_phone</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your-phone</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">tel</code></td>
                         <td className="px-4 py-2 text-slate-500">+7 (999) 123-45-67</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="px-4 py-2 font-medium text-slate-800">Email</td>
                         <td className="px-4 py-2"><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">email</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your_email</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your-email</code></td>
                         <td className="px-4 py-2 text-slate-500">client@example.com</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="px-4 py-2 font-medium text-slate-800">Компания</td>
                         <td className="px-4 py-2"><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">company</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">organization</code></td>
                         <td className="px-4 py-2 text-slate-500">ООО Ромашка</td>
                       </tr>
                       <tr>
                         <td className="px-4 py-2 font-medium text-slate-800">Сообщение</td>
                         <td className="px-4 py-2"><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">message</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your_message</code> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">your-message</code></td>
                         <td className="px-4 py-2 text-slate-500">Хочу заказать сайт</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">Все остальные поля формы также сохраняются в поле «Текущая ситуация» как JSON.</p>
               </div>

               {/* Instructions per plugin */}
               <div className="space-y-6 mb-8">
                 <h3 className="font-semibold text-slate-800">Инструкции по настройке</h3>

                 {/* Elementor */}
                 <div className="border border-slate-200 rounded-lg p-5">
                   <h4 className="font-semibold text-slate-800 mb-2">Elementor Pro (Action After Submit → Webhook)</h4>
                   <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
                     <li>Откройте форму в редакторе Elementor</li>
                     <li>Перейдите в раздел <strong>Actions After Submit</strong></li>
                     <li>Добавьте действие <strong>Webhook</strong></li>
                     <li>В поле <strong>Webhook URL</strong> вставьте ваш URL (выше)</li>
                     <li>Убедитесь, что поля формы имеют ID: <code>name</code>, <code>phone</code>, <code>email</code>, <code>message</code></li>
                     <li>В <strong>Advanced</strong> → каждому полю формы задайте соответствующий ID</li>
                     <li>Сохраните и опубликуйте страницу</li>
                   </ol>
                 </div>

                 {/* Contact Form 7 */}
                 <div className="border border-slate-200 rounded-lg p-5">
                   <h4 className="font-semibold text-slate-800 mb-2">Contact Form 7 + плагин CF7 to Webhook</h4>
                   <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
                     <li>Установите плагин <strong>CF7 to Webhook</strong> (или CF7 Webhook)</li>
                     <li>Откройте настройки вашей формы → вкладка <strong>Webhook</strong></li>
                     <li>Вставьте ваш Webhook URL</li>
                     <li>Формат отправки: <strong>JSON</strong></li>
                     <li>Имена полей в форме CF7 должны быть: <code>[text* your-name]</code>, <code>[tel* your-phone]</code>, <code>[email* your-email]</code>, <code>[textarea your-message]</code></li>
                     <li>CRM автоматически распознает поля с дефисами (<code>your-name</code>, <code>your-phone</code> и т.д.)</li>
                   </ol>
                 </div>

                 {/* WPForms */}
                 <div className="border border-slate-200 rounded-lg p-5">
                   <h4 className="font-semibold text-slate-800 mb-2">WPForms (Webhooks Addon)</h4>
                   <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
                     <li>Установите аддон <strong>Webhooks</strong> для WPForms</li>
                     <li>Откройте форму → <strong>Settings</strong> → <strong>Webhooks</strong></li>
                     <li>Включите Webhook и вставьте URL</li>
                     <li>В разделе <strong>Field Mapping</strong> сопоставьте поля формы с ключами: <code>name</code>, <code>phone</code>, <code>email</code>, <code>message</code></li>
                     <li>Формат: JSON. Метод: POST</li>
                   </ol>
                 </div>

                 {/* Custom / any form */}
                 <div className="border border-slate-200 rounded-lg p-5">
                   <h4 className="font-semibold text-slate-800 mb-2">Любая форма / Свой код</h4>
                   <p className="text-sm text-slate-600 mb-3">Отправьте POST-запрос на ваш Webhook URL с JSON-телом:</p>
                   <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">{`fetch("https://crm.weboptics.ru/api/webhooks/wordpress/${user?.uid || 'ВАШ_USER_ID'}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Иван Петров",
    phone: "+7 (999) 123-45-67",
    email: "client@example.com",
    company: "ООО Ромашка",
    message: "Хочу заказать разработку сайта"
  })
})`}</pre>
                 </div>
               </div>

               {/* What happens */}
               <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
                 <h3 className="font-semibold text-emerald-900 mb-2">Что происходит при получении заявки</h3>
                 <ul className="list-disc list-inside text-sm text-emerald-800 space-y-1.5">
                   <li>Создается карточка сделки в колонке <strong>«Новые лиды»</strong></li>
                   <li>Телефон, email и компания сохраняются в отдельных полях карточки</li>
                   <li>Источник автоматически помечается как <strong>«С сайта»</strong></li>
                   <li>Температура устанавливается как <strong>«Теплый»</strong></li>
                   <li>Сообщение и все остальные данные формы сохраняются в поле «Текущая ситуация»</li>
                   <li>В ленте активности создается запись «Заявка получена с сайта»</li>
                 </ul>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
