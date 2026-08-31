import React, { useState } from 'react';
import { Plus, Trash2, FileText, ChevronDown } from 'lucide-react';

interface CPStage {
  stage: string;
  action: string;
  result: string;
}

interface CPTimeline {
  stage: string;
  duration: string;
  clientAction: string;
}

interface CPPackage {
  name: string;
  description: string;
  price: string;
}

interface CPConstructorData {
  templateId: string;
  clientName: string;
  projectType: string;
  taskDescription: string;
  stages: CPStage[];
  included: string[];
  excluded: string[];
  timeline: CPTimeline[];
  packages: CPPackage[];
}

interface Template {
  id: string;
  name: string;
  stages: CPStage[];
  included: string[];
  excluded: string[];
  timeline: CPTimeline[];
  defaultPackages: CPPackage[];
}

const TEMPLATES: Template[] = [
  {
    id: 'website',
    name: 'Разработка сайта',
    stages: [
      { stage: 'Аналитика и ТЗ', action: 'Изучаем нишу, конкурентов, целевую аудиторию. Формируем структуру сайта и техническое задание', result: 'Документ ТЗ, структура сайта, карта страниц' },
      { stage: 'Прототипирование', action: 'Разрабатываем wireframe-прототипы ключевых страниц с учетом конверсионных сценариев', result: 'Кликабельный прототип, согласованный с клиентом' },
      { stage: 'Дизайн', action: 'Создаем уникальный дизайн на основе прототипов с учетом фирменного стиля', result: 'Макеты всех страниц в Figma' },
      { stage: 'Верстка и разработка', action: 'Адаптивная верстка, интеграция с CMS, настройка форм и интерактива', result: 'Рабочий сайт на тестовом домене' },
      { stage: 'SEO-подготовка', action: 'Базовая оптимизация: мета-теги, заголовки, скорость загрузки, sitemap, robots.txt', result: 'Сайт готов к индексации поисковиками' },
      { stage: 'Тестирование и запуск', action: 'Проверка на всех устройствах, настройка аналитики, перенос на боевой домен', result: 'Работающий сайт с подключенной аналитикой' },
    ],
    included: [
      'Адаптивная верстка (мобильные, планшеты, десктоп)',
      'Интеграция с CMS (управление контентом)',
      'Базовая SEO-оптимизация',
      'Подключение Яндекс.Метрики и Google Analytics',
      'SSL-сертификат',
      'Формы обратной связи',
      'Обучение работе с сайтом',
    ],
    excluded: [
      'Написание текстов и копирайтинг',
      'Профессиональная фотосъемка',
      'SEO-продвижение после запуска',
      'Контекстная реклама',
      'Интеграция с 1С и другими системами',
    ],
    timeline: [
      { stage: 'Аналитика и ТЗ', duration: '3-5 дней', clientAction: 'Заполнить бриф, предоставить материалы' },
      { stage: 'Прототип и дизайн', duration: '7-10 дней', clientAction: 'Согласование макетов (до 2 правок)' },
      { stage: 'Разработка', duration: '10-14 дней', clientAction: 'Предоставить тексты и фото' },
      { stage: 'Тестирование и запуск', duration: '3-5 дней', clientAction: 'Финальная проверка и доступ к домену' },
    ],
    defaultPackages: [
      { name: 'Лендинг', description: '1 страница, адаптив, формы, аналитика', price: '' },
      { name: 'Корпоративный сайт', description: '5-8 страниц, CMS, SEO-подготовка', price: '' },
      { name: 'Сайт под ключ', description: '10+ страниц, CMS, SEO, интеграции, блог', price: '' },
    ],
  },
  {
    id: 'seo',
    name: 'SEO-продвижение',
    stages: [
      { stage: 'Технический аудит', action: 'Полная проверка сайта: скорость, индексация, ошибки, мобильность, структура', result: 'Отчет с приоритетным списком доработок' },
      { stage: 'Сбор семантики', action: 'Подбор ключевых запросов, кластеризация, распределение по страницам', result: 'Семантическое ядро, карта релевантности' },
      { stage: 'Техническая оптимизация', action: 'Исправление ошибок, ускорение, настройка индексации, микроразметка', result: 'Технически чистый сайт' },
      { stage: 'Контентная оптимизация', action: 'Оптимизация мета-тегов, заголовков, текстов под семантику', result: 'Оптимизированные страницы' },
      { stage: 'Внешняя оптимизация', action: 'Наращивание ссылочной массы, работа с каталогами и площадками', result: 'Рост авторитетности домена' },
      { stage: 'Аналитика и отчетность', action: 'Ежемесячный мониторинг позиций, трафика, конверсий', result: 'Прозрачные отчеты с динамикой' },
    ],
    included: [
      'Технический аудит сайта',
      'Сбор и кластеризация семантического ядра',
      'Оптимизация мета-тегов и заголовков',
      'Внутренняя перелинковка',
      'Базовое наращивание ссылок',
      'Ежемесячные отчеты по позициям и трафику',
      'Рекомендации по контенту',
    ],
    excluded: [
      'Разработка / редизайн сайта',
      'Написание текстов (опционально за доп. плату)',
      'Контекстная реклама',
      'Доработки функционала сайта',
    ],
    timeline: [
      { stage: 'Аудит и семантика', duration: '1-2 недели', clientAction: 'Доступ к аналитике и панелям вебмастеров' },
      { stage: 'Техническая оптимизация', duration: '2-3 недели', clientAction: 'Внедрение рекомендаций (если нет доступа к сайту)' },
      { stage: 'Контентная оптимизация', duration: 'ежемесячно', clientAction: 'Согласование текстов' },
      { stage: 'Первые результаты', duration: '2-3 месяца', clientAction: 'Терпение и обратная связь' },
    ],
    defaultPackages: [
      { name: 'Старт', description: 'Аудит + семантика + базовая оптимизация (разово)', price: '' },
      { name: 'Продвижение', description: 'Ежемесячное SEO: оптимизация, ссылки, отчеты', price: '' },
      { name: 'Комплекс', description: 'SEO + контент-план + написание статей', price: '' },
    ],
  },
  {
    id: 'context_ads',
    name: 'Контекстная реклама',
    stages: [
      { stage: 'Анализ ниши', action: 'Изучаем конкурентов, спрос, целевую аудиторию и их поведение', result: 'Стратегия рекламных кампаний' },
      { stage: 'Сбор ключевых слов', action: 'Подбор целевых запросов, минус-слова, группировка по кампаниям', result: 'Готовая структура кампаний' },
      { stage: 'Создание объявлений', action: 'Написание заголовков, текстов, быстрые ссылки, уточнения', result: 'Готовые к запуску объявления' },
      { stage: 'Настройка и запуск', action: 'Настройка кампаний в Яндекс.Директ / Google Ads, UTM-метки, цели', result: 'Запущенные рекламные кампании' },
      { stage: 'Оптимизация', action: 'Анализ статистики, корректировка ставок, A/B тесты, минусация', result: 'Снижение стоимости заявки' },
    ],
    included: [
      'Настройка рекламных кампаний',
      'Подбор ключевых слов и минус-слов',
      'Написание объявлений',
      'Настройка целей и аналитики',
      'Еженедельная оптимизация',
      'Ежемесячные отчеты',
    ],
    excluded: [
      'Рекламный бюджет (оплачивается отдельно)',
      'Разработка посадочных страниц',
      'Разработка баннеров для КМС/РСЯ',
      'SEO-продвижение',
    ],
    timeline: [
      { stage: 'Анализ и подготовка', duration: '3-5 дней', clientAction: 'Доступ к аналитике, информация об услугах' },
      { stage: 'Настройка и запуск', duration: '3-5 дней', clientAction: 'Согласование объявлений' },
      { stage: 'Оптимизация', duration: 'еженедельно', clientAction: 'Обратная связь по качеству заявок' },
    ],
    defaultPackages: [
      { name: 'Настройка', description: 'Разовая настройка кампаний (Директ или Google Ads)', price: '' },
      { name: 'Ведение', description: 'Ежемесячная оптимизация и отчетность', price: '' },
      { name: 'Под ключ', description: 'Настройка + ведение + посадочная страница', price: '' },
    ],
  },
  {
    id: 'redesign',
    name: 'Редизайн сайта',
    stages: [
      { stage: 'UX-аудит', action: 'Анализ текущего сайта: поведение пользователей, карта кликов, воронка, точки выхода', result: 'Список проблем с приоритетами' },
      { stage: 'Новая структура', action: 'Пересмотр навигации, логики страниц и конверсионных сценариев', result: 'Обновленная карта сайта и прототипы' },
      { stage: 'Дизайн', action: 'Новый визуал с сохранением узнаваемости бренда, акцент на конверсию', result: 'Макеты в Figma' },
      { stage: 'Разработка', action: 'Верстка, перенос контента, сохранение SEO-позиций (301 редиректы)', result: 'Обновленный сайт на тестовом домене' },
      { stage: 'Тестирование и миграция', action: 'Проверка, перенос, мониторинг позиций после запуска', result: 'Новый сайт без потери трафика' },
    ],
    included: [
      'UX-аудит текущего сайта',
      'Адаптивный дизайн',
      'Верстка и разработка',
      'Перенос контента',
      'Настройка 301 редиректов (сохранение SEO)',
      'Подключение аналитики',
    ],
    excluded: [
      'Написание новых текстов',
      'Фотосъемка',
      'SEO-продвижение после запуска',
      'Изменение функционала (личные кабинеты, калькуляторы)',
    ],
    timeline: [
      { stage: 'UX-аудит', duration: '3-5 дней', clientAction: 'Доступ к аналитике' },
      { stage: 'Дизайн', duration: '7-10 дней', clientAction: 'Согласование макетов' },
      { stage: 'Разработка и запуск', duration: '10-14 дней', clientAction: 'Контент и финальная проверка' },
    ],
    defaultPackages: [
      { name: 'Точечный редизайн', description: 'Главная + 2-3 ключевые страницы', price: '' },
      { name: 'Полный редизайн', description: 'Все страницы, новая структура, адаптив', price: '' },
    ],
  },
  {
    id: 'support',
    name: 'Техническая поддержка',
    stages: [
      { stage: 'Подключение', action: 'Получаем доступы, изучаем сайт, фиксируем текущее состояние', result: 'Чек-лист состояния сайта' },
      { stage: 'Регулярное обслуживание', action: 'Обновление CMS и плагинов, бекапы, мониторинг работоспособности', result: 'Стабильно работающий сайт' },
      { stage: 'Доработки', action: 'Мелкие правки контента, добавление страниц, изменения по запросу', result: 'Актуальный сайт' },
    ],
    included: [
      'Регулярные бекапы',
      'Обновление CMS и плагинов',
      'Мониторинг доступности 24/7',
      'Мелкие правки (до N часов/месяц)',
      'Консультации по развитию сайта',
    ],
    excluded: [
      'Крупные доработки функционала',
      'Редизайн',
      'SEO-продвижение',
      'Написание контента',
    ],
    timeline: [
      { stage: 'Подключение', duration: '1-2 дня', clientAction: 'Предоставить доступы к хостингу и CMS' },
      { stage: 'Обслуживание', duration: 'ежемесячно', clientAction: 'Заявки на правки через чат/email' },
    ],
    defaultPackages: [
      { name: 'Базовый', description: 'Бекапы, обновления, мониторинг, до 2ч правок/мес', price: '' },
      { name: 'Расширенный', description: 'Всё из базового + до 8ч правок/мес, приоритет', price: '' },
    ],
  },
  {
    id: 'complex',
    name: 'Комплексное продвижение',
    stages: [
      { stage: 'Аудит и стратегия', action: 'Полный аудит: сайт, конкуренты, рекламные каналы. Формируем стратегию', result: 'Документ стратегии на 3-6 месяцев' },
      { stage: 'Доработка сайта', action: 'Устранение технических проблем, улучшение конверсии, посадочные', result: 'Сайт готов к приему трафика' },
      { stage: 'Запуск рекламы', action: 'Настройка контекстной рекламы для быстрых заявок', result: 'Поток заявок с первого месяца' },
      { stage: 'SEO-продвижение', action: 'Параллельная работа над органическим трафиком', result: 'Рост бесплатного трафика с 2-3 месяца' },
      { stage: 'Аналитика и масштабирование', action: 'Сквозная аналитика, оптимизация каналов, масштабирование', result: 'Рост заявок при снижении стоимости' },
    ],
    included: [
      'Комплексный аудит',
      'Доработка сайта под конверсию',
      'Настройка и ведение контекстной рекламы',
      'SEO-продвижение',
      'Ежемесячные отчеты по всем каналам',
      'Рекомендации по контенту',
    ],
    excluded: [
      'Рекламный бюджет',
      'Полный редизайн сайта',
      'SMM и ведение соцсетей',
      'Написание текстов (опционально)',
    ],
    timeline: [
      { stage: 'Аудит и стратегия', duration: '1 неделя', clientAction: 'Доступы, информация о бизнесе' },
      { stage: 'Доработки + запуск рекламы', duration: '2-3 недели', clientAction: 'Согласование, рекламный бюджет' },
      { stage: 'SEO + оптимизация', duration: 'ежемесячно', clientAction: 'Обратная связь по заявкам' },
    ],
    defaultPackages: [
      { name: 'Старт', description: 'Аудит + контекст + базовое SEO', price: '' },
      { name: 'Рост', description: 'Контекст + SEO + доработки сайта + аналитика', price: '' },
      { name: 'Максимум', description: 'Всё из Рост + контент-маркетинг + расширенная аналитика', price: '' },
    ],
  },
];

interface CPConstructorProps {
  clientName: string;
  projectType: string;
  taskDescription: string;
  agencyName: string;
  onGenerate: (markdown: string) => void;
}

export default function CPConstructor({ clientName, projectType, taskDescription, agencyName, onGenerate }: CPConstructorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [data, setData] = useState<CPConstructorData>(() => initFromTemplate(TEMPLATES[0], clientName, projectType, taskDescription));

  function initFromTemplate(t: Template, name: string, project: string, task: string): CPConstructorData {
    return {
      templateId: t.id,
      clientName: name || '',
      projectType: project || t.name,
      taskDescription: task || '',
      stages: t.stages.map(s => ({ ...s })),
      included: [...t.included],
      excluded: [...t.excluded],
      timeline: t.timeline.map(tl => ({ ...tl })),
      packages: t.defaultPackages.map(p => ({ ...p })),
    };
  }

  const handleTemplateChange = (id: string) => {
    const t = TEMPLATES.find(t => t.id === id);
    if (!t) return;
    setSelectedTemplate(id);
    setData(initFromTemplate(t, data.clientName, data.projectType, data.taskDescription));
  };

  const generateStructuredJSON = (): string => {
    const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    return JSON.stringify({
      clientName: data.clientName,
      projectType: data.projectType,
      taskDescription: data.taskDescription,
      agencyName: agencyName || '',
      date: today,
      stages: data.stages,
      included: data.included,
      excluded: data.excluded,
      timeline: data.timeline,
      packages: data.packages,
    });
  };

  const handleGenerate = () => {
    onGenerate(generateStructuredJSON());
  };

  const updateStage = (index: number, field: keyof CPStage, value: string) => {
    const updated = [...data.stages];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, stages: updated });
  };

  const addStage = () => {
    setData({ ...data, stages: [...data.stages, { stage: '', action: '', result: '' }] });
  };

  const removeStage = (index: number) => {
    setData({ ...data, stages: data.stages.filter((_, i) => i !== index) });
  };

  const updateListItem = (list: 'included' | 'excluded', index: number, value: string) => {
    const updated = [...data[list]];
    updated[index] = value;
    setData({ ...data, [list]: updated });
  };

  const addListItem = (list: 'included' | 'excluded') => {
    setData({ ...data, [list]: [...data[list], ''] });
  };

  const removeListItem = (list: 'included' | 'excluded', index: number) => {
    setData({ ...data, [list]: data[list].filter((_, i) => i !== index) });
  };

  const updateTimeline = (index: number, field: keyof CPTimeline, value: string) => {
    const updated = [...data.timeline];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, timeline: updated });
  };

  const addTimeline = () => {
    setData({ ...data, timeline: [...data.timeline, { stage: '', duration: '', clientAction: '' }] });
  };

  const removeTimeline = (index: number) => {
    setData({ ...data, timeline: data.timeline.filter((_, i) => i !== index) });
  };

  const updatePackage = (index: number, field: keyof CPPackage, value: string) => {
    const updated = [...data.packages];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, packages: updated });
  };

  const addPackage = () => {
    setData({ ...data, packages: [...data.packages, { name: '', description: '', price: '' }] });
  };

  const removePackage = (index: number) => {
    setData({ ...data, packages: data.packages.filter((_, i) => i !== index) });
  };

  const inputClass = "w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none";
  const sectionClass = "bg-white border border-slate-200 rounded-xl p-5 shadow-sm";

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Template selector + basic info */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Конструктор КП
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Шаблон услуги</label>
            <select value={selectedTemplate} onChange={e => handleTemplateChange(e.target.value)} className={inputClass}>
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Клиент *</label>
              <input type="text" value={data.clientName} onChange={e => setData({ ...data, clientName: e.target.value })} className={inputClass} placeholder="ООО «Альфа»" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Тип проекта</label>
              <input type="text" value={data.projectType} onChange={e => setData({ ...data, projectType: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Описание задачи</label>
            <textarea rows={2} value={data.taskDescription} onChange={e => setData({ ...data, taskDescription: e.target.value })} className={inputClass + " resize-y"} placeholder="Краткое описание того, что нужно клиенту..." />
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Этапы работ</h3>
          <button onClick={addStage} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>
        <div className="space-y-3">
          {data.stages.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-slate-400 mt-2 w-5 flex-shrink-0">{i + 1}.</span>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input value={s.stage} onChange={e => updateStage(i, 'stage', e.target.value)} className={inputClass} placeholder="Этап" />
                <input value={s.action} onChange={e => updateStage(i, 'action', e.target.value)} className={inputClass} placeholder="Что делаем" />
                <input value={s.result} onChange={e => updateStage(i, 'result', e.target.value)} className={inputClass} placeholder="Результат" />
              </div>
              <button onClick={() => removeStage(i)} className="mt-1.5 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Included / Excluded */}
      <div className="grid grid-cols-2 gap-5">
        <div className={sectionClass}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Что входит</h3>
            <button onClick={() => addListItem('included')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {data.included.map((item, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <span className="text-green-500 text-xs">✓</span>
                <input value={item} onChange={e => updateListItem('included', i, e.target.value)} className={inputClass} />
                <button onClick={() => removeListItem('included', i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className={sectionClass}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Что НЕ входит</h3>
            <button onClick={() => addListItem('excluded')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {data.excluded.map((item, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <span className="text-red-400 text-xs">✕</span>
                <input value={item} onChange={e => updateListItem('excluded', i, e.target.value)} className={inputClass} />
                <button onClick={() => removeListItem('excluded', i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Сроки</h3>
          <button onClick={addTimeline} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>
        <div className="space-y-2">
          {data.timeline.map((tl, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input value={tl.stage} onChange={e => updateTimeline(i, 'stage', e.target.value)} className={inputClass} placeholder="Этап" />
                <input value={tl.duration} onChange={e => updateTimeline(i, 'duration', e.target.value)} className={inputClass} placeholder="Срок" />
                <input value={tl.clientAction} onChange={e => updateTimeline(i, 'clientAction', e.target.value)} className={inputClass} placeholder="Что нужно от клиента" />
              </div>
              <button onClick={() => removeTimeline(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Варианты и стоимость</h3>
          <button onClick={addPackage} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>
        <div className="space-y-3">
          {data.packages.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input value={p.name} onChange={e => updatePackage(i, 'name', e.target.value)} className={inputClass} placeholder="Название" />
                <input value={p.description} onChange={e => updatePackage(i, 'description', e.target.value)} className={inputClass} placeholder="Состав" />
                <input value={p.price} onChange={e => updatePackage(i, 'price', e.target.value)} className={inputClass} placeholder="Стоимость, руб." />
              </div>
              <button onClick={() => removePackage(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="sticky bottom-0 bg-slate-50 py-4 -mx-6 px-6 border-t border-slate-200">
        <button
          onClick={handleGenerate}
          disabled={!data.clientName}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Сформировать КП
        </button>
      </div>
    </div>
  );
}
