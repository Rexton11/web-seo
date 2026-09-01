import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Copy, Check, Edit2, Eye, Download, Building2, Calendar, User, CheckCircle2, XCircle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { generatePDF } from '../utils/pdf';

interface CPPreviewProps {
  content: string;
  onChange: (newContent: string) => void;
}

interface CPStructuredData {
  clientName: string;
  projectType: string;
  taskDescription?: string;
  agencyName?: string;
  date: string;
  stages: { stage: string; action: string; result: string }[];
  included: string[];
  excluded: string[];
  timeline: { stage: string; duration: string; clientAction: string }[];
  packages: { name: string; description: string; price: string }[];
}

function tryParseStructured(content: string): CPStructuredData | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.stages && Array.isArray(parsed.stages)) {
      return parsed as CPStructuredData;
    }
  } catch {}
  return null;
}

function StyledCPView({ data }: { data: CPStructuredData }) {
  return (
    <div className="bg-white min-h-full">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-8 py-10 sm:px-12 sm:py-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue-200 text-sm font-medium tracking-wider uppercase mb-3">Коммерческое предложение</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{data.projectType}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{data.clientName}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{data.date}</span>
            {data.agencyName && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{data.agencyName}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 space-y-10">
        {/* Task description */}
        {data.taskDescription && (
          <section>
            <p className="text-slate-600 text-base leading-relaxed border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-3 rounded-r-lg">
              {data.taskDescription}
            </p>
          </section>
        )}

        {/* Stages */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Что предлагаем</h2>
          </div>
          <div className="space-y-3">
            {data.stages.map((s, i) => (
              <div key={i} className="group border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm">{s.stage}</h3>
                    <p className="text-sm text-slate-500 mt-1">{s.action}</p>
                    <div className="mt-2 flex items-start gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-emerald-700 font-medium">{s.result}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Included / Excluded */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
            <h3 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Что входит в работу
            </h3>
            <ul className="space-y-2">
              {data.included.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-600 text-sm mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Что не входит
            </h3>
            <ul className="space-y-2">
              {data.excluded.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-slate-400 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Timeline */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Сроки</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Этап</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Срок</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Что нужно от клиента</th>
                </tr>
              </thead>
              <tbody>
                {data.timeline.map((tl, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                    <td className="px-4 py-3 font-medium text-slate-800 border-b border-slate-100">{tl.stage}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold border-b border-slate-100 whitespace-nowrap">{tl.duration}</td>
                    <td className="px-4 py-3 text-slate-500 border-b border-slate-100">{tl.clientAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2 italic">
            * Пауза в согласовании со стороны клиента переносит сроки на соответствующий период.
          </p>
        </section>

        {/* Packages / Pricing */}
        {data.packages.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Стоимость</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.packages.map((p, i) => {
                const isMiddle = data.packages.length === 3 && i === 1;
                return (
                  <div key={i} className={`rounded-xl border-2 p-5 flex flex-col transition-all ${isMiddle ? 'border-blue-500 bg-blue-50/30 shadow-md relative' : 'border-slate-200 hover:border-blue-200'}`}>
                    {isMiddle && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                        Популярный
                      </span>
                    )}
                    <h3 className="font-bold text-slate-800 text-base mb-1">{p.name}</h3>
                    <p className="text-sm text-slate-500 flex-1 mb-4">{p.description}</p>
                    <div className="text-lg font-bold text-blue-700">
                      {p.price || 'По запросу'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Next step */}
        <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-6 sm:p-8">
          <h3 className="font-bold text-lg mb-4">Следующий шаг</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {['Выберите вариант', 'Созвонимся на 20 минут', 'Подписываем договор', 'Начинаем работу'].map((step, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-slate-200">{step}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CPPreview({ content, onChange }: CPPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const structuredData = tryParseStructured(content);

  const handleCopy = async () => {
    try {
      if (structuredData) {
        const text = structuredToText(structuredData);
        await navigator.clipboard.writeText(text);
      } else {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    await generatePDF('cp-preview-content', 'Коммерческое_предложение.pdf');
    setIsDownloading(false);
  };

  if (!content) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
        <FileTextPlaceholder />
        <p className="mt-4 text-sm font-medium">Заполните конструктор, чтобы сформировать КП</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
              !isEditing ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            Просмотр
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
              isEditing ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            Редактировать
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading || isEditing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Сохранение...' : 'PDF'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Скопировано!' : 'Скопировать'}
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div id="cp-preview-content">
          {isEditing ? (
            <div className="p-8 lg:p-12 max-w-4xl mx-auto">
              <textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-[70vh] p-4 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
                spellCheck={false}
              />
            </div>
          ) : structuredData ? (
            <StyledCPView data={structuredData} />
          ) : (
            <div className="p-8 lg:p-12 max-w-4xl mx-auto">
              <div className="prose prose-slate prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-2 prose-th:text-left prose-td:border prose-td:border-slate-300 prose-td:p-2">
                <Markdown>{content}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function structuredToText(data: CPStructuredData): string {
  let text = `КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ\n\n`;
  text += `Клиент: ${data.clientName}\n`;
  text += `Проект: ${data.projectType}\n`;
  text += `Дата: ${data.date}\n`;
  if (data.agencyName) text += `Исполнитель: ${data.agencyName}\n`;
  text += `\n`;
  if (data.taskDescription) text += `Задача: ${data.taskDescription}\n\n`;

  text += `ЧТО ПРЕДЛАГАЕМ:\n`;
  data.stages.forEach((s, i) => {
    text += `${i + 1}. ${s.stage} — ${s.action} → ${s.result}\n`;
  });
  text += `\nЧТО ВХОДИТ:\n`;
  data.included.forEach(item => { text += `✓ ${item}\n`; });
  text += `\nЧТО НЕ ВХОДИТ:\n`;
  data.excluded.forEach(item => { text += `— ${item}\n`; });
  text += `\nСРОКИ:\n`;
  data.timeline.forEach(tl => {
    text += `${tl.stage}: ${tl.duration} (от клиента: ${tl.clientAction})\n`;
  });
  if (data.packages.length > 0) {
    text += `\nСТОИМОСТЬ:\n`;
    data.packages.forEach(p => {
      text += `${p.name} — ${p.description} — ${p.price || 'По запросу'}\n`;
    });
  }
  return text;
}

function FileTextPlaceholder() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
