import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Copy, Check, Edit2, Eye, Download } from 'lucide-react';
import { generatePDF } from '../utils/pdf';

interface CPPreviewProps {
  content: string;
  onChange: (newContent: string) => void;
}

export default function CPPreview({ content, onChange }: CPPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
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
        <p className="mt-4 text-sm font-medium">Заполните форму слева, чтобы сгенерировать КП</p>
        <p className="text-xs max-w-sm text-center mt-2 opacity-80">
          Оно будет создано по методологии: с контекстом, точками роста, scope работ, сроками и тремя тарифами.
        </p>
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
            {copied ? 'Скопировано!' : 'Скопировать текст'}
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-[70vh] p-4 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
              spellCheck={false}
            />
          ) : (
            <div id="cp-preview-content" className="prose prose-slate prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-2 prose-th:text-left prose-td:border prose-td:border-slate-300 prose-td:p-2">
              <Markdown>{content}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
