import React, { useState, useEffect } from 'react';
import { CPFormData } from '../types';
import { Loader2, FileText } from 'lucide-react';

interface CPFormProps {
  onGenerate: (data: CPFormData) => void;
  isLoading: boolean;
  initialData?: Partial<CPFormData>;
  buttonText?: string;
}

export default function CPForm({ onGenerate, isLoading, initialData, buttonText = 'Сгенерировать КП' }: CPFormProps) {
  const [formData, setFormData] = useState<CPFormData>({
    clientName: initialData?.clientName || '',
    projectType: initialData?.projectType || 'Разработка сайта + SEO',
    currentSituation: initialData?.currentSituation || '',
    businessGoals: initialData?.businessGoals || '',
    growthPoints: initialData?.growthPoints || '',
    budget: initialData?.budget || '',
    timeline: initialData?.timeline || '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        clientName: initialData.clientName || prev.clientName,
        projectType: initialData.projectType || prev.projectType,
        currentSituation: initialData.currentSituation || prev.currentSituation,
        businessGoals: initialData.businessGoals || prev.businessGoals,
        growthPoints: initialData.growthPoints || prev.growthPoints,
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName) return;
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white border-r border-slate-200 overflow-y-auto">
      <div className="p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Вводные данные (Discovery)
        </h2>
        <p className="text-sm text-slate-500 mt-1">Заполните поля после квалификации клиента</p>
      </div>

      <div className="p-6 space-y-5 flex-grow">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 mb-1">
            Название клиента или компании *
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            required
            value={formData.clientName}
            onChange={handleChange}
            placeholder="ООО «Альфа»"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="projectType" className="block text-sm font-medium text-slate-700 mb-1">
            Тип проекта (Услуга) *
          </label>
          <input
            type="text"
            id="projectType"
            name="projectType"
            list="projectTypeOptions"
            required
            value={formData.projectType}
            onChange={handleChange}
            placeholder="Например: Разработка сайта или Свой вариант"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <datalist id="projectTypeOptions">
            <option value="Разработка сайта (Услуги / B2B)" />
            <option value="Разработка интернет-магазина" />
            <option value="Комплексное SEO продвижение" />
            <option value="Разработка сайта + базовая SEO подготовка" />
            <option value="Точечный редизайн и улучшение конверсии" />
            <option value="Техническая поддержка и доработка" />
          </datalist>
          <p className="text-xs text-slate-500 mt-1">Выберите из списка или введите свой вариант услуги</p>
        </div>

        <div>
          <label htmlFor="currentSituation" className="block text-sm font-medium text-slate-700 mb-1">
            Текущая ситуация
          </label>
          <textarea
            id="currentSituation"
            name="currentSituation"
            rows={2}
            value={formData.currentSituation}
            onChange={handleChange}
            placeholder="Что происходит сейчас? (Напр.: Сайт старый, трафик идет из контекста)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
          />
        </div>

        <div>
          <label htmlFor="businessGoals" className="block text-sm font-medium text-slate-700 mb-1">
            Бизнес-цели
          </label>
          <textarea
            id="businessGoals"
            name="businessGoals"
            rows={2}
            value={formData.businessGoals}
            onChange={handleChange}
            placeholder="Чего хотят достичь? (Напр.: Увеличить обращения по услуге X)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
          />
        </div>

        <div>
          <label htmlFor="growthPoints" className="block text-sm font-medium text-slate-700 mb-1">
            Выявленные точки роста
          </label>
          <textarea
            id="growthPoints"
            name="growthPoints"
            rows={2}
            value={formData.growthPoints}
            onChange={handleChange}
            placeholder="Наблюдения. (Напр.: Нет отдельных посадочных, сложная форма)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-slate-700 mb-1">
              Бюджет (Опционально)
            </label>
            <input
              type="text"
              id="budget"
              name="budget"
              value={formData.budget || ''}
              onChange={handleChange}
              placeholder="Напр.: от 150 000 руб."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-1">
              Сроки (Опционально)
            </label>
            <input
              type="text"
              id="timeline"
              name="timeline"
              value={formData.timeline || ''}
              onChange={handleChange}
              placeholder="Напр.: 1-2 месяца"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10">
        <button
          type="submit"
          disabled={isLoading || !formData.clientName}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Генерация...
            </>
          ) : (
            buttonText
          )}
        </button>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Нейросеть сформирует модульное КП по методологии за ~15 секунд.
        </p>
      </div>
    </form>
  );
}
