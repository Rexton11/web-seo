import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { KBCategory, KBArticle, Attachment } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Save, ArrowLeft, Eye, Edit3, Globe, Pin, Tag, X, Plus,
  Paperclip, Upload, Download, Trash2, Copy, Link, Check,
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Quote, Minus, FileUp,
  Table, LinkIcon, Image
} from 'lucide-react';

function slugify(str: string): string {
  const ru: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',к:'k',
    л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',
    ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return str.toLowerCase().split('').map(c => ru[c] || c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface ToolbarAction {
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
}

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [slug, setSlug] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const checkboxCountRef = useRef(0);

  const getToken = async () => user ? await user.getIdToken() : '';

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const token = await getToken();
      const [catRes, artRes] = await Promise.all([
        fetch('/api/kb/categories', { headers: { Authorization: `Bearer ${token}` } }),
        id !== 'new' ? fetch(`/api/kb/articles/${id}`, { headers: { Authorization: `Bearer ${token}` } }) : null,
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (artRes && artRes.ok) {
        const a = await artRes.json();
        setTitle(a.title);
        setContent(a.content || '');
        setCategoryId(a.categoryId || '');
        setTags(typeof a.tags === 'string' ? JSON.parse(a.tags) : (a.tags || []));
        setIsPublic(a.isPublic);
        setIsPinned(a.isPinned);
        setSlug(a.slug);
      }
      if (id !== 'new') fetchAttachments(token);
    };
    load();
  }, [user, id]);

  const fetchAttachments = async (token?: string) => {
    const t = token || await getToken();
    const res = await fetch(`/api/attachments?articleId=${id}`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setAttachments(await res.json());
  };

  const handleSave = async () => {
    setSaving(true);
    const token = await getToken();
    const articleSlug = slug || slugify(title) || `article-${Date.now()}`;
    const body = { title, content, categoryId: categoryId || null, tags, isPublic, isPinned, slug: articleSlug };

    const res = await fetch(`/api/kb/articles/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setSlug(articleSlug);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const token = await getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('articleId', id!);
    await fetch('/api/attachments', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    setUploading(false);
    fetchAttachments();
    e.target.value = '';
  };

  const handleDeleteAttachment = async (attId: string) => {
    const token = await getToken();
    await fetch(`/api/attachments/${attId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAttachments();
  };

  const toggleCheckbox = useCallback((checkboxIndex: number) => {
    let count = 0;
    const newContent = content.replace(/- \[([ x])\]/g, (match, state) => {
      if (count++ === checkboxIndex) {
        return state === 'x' ? '- [ ]' : '- [x]';
      }
      return match;
    });
    setContent(newContent);
  }, [content]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/kb/${user?.uid}/${slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const insertAtCursor = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const text = selected || placeholder;
    const newContent = content.substring(0, start) + before + text + after + content.substring(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      const cursorPos = start + before.length;
      ta.selectionStart = cursorPos;
      ta.selectionEnd = cursorPos + text.length;
      ta.focus();
    });
  }, [content]);

  const wrapLine = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);

    if (selected.includes('\n')) {
      const lines = selected.split('\n');
      const wrapped = lines.map((line, i) => {
        if (prefix === '1. ') return `${i + 1}. ${line}`;
        return `${prefix}${line}`;
      }).join('\n');
      const newContent = content.substring(0, start) + wrapped + content.substring(end);
      setContent(newContent);
    } else {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
      setContent(newContent);
      requestAnimationFrame(() => {
        ta.selectionStart = start + prefix.length;
        ta.selectionEnd = end + prefix.length;
        ta.focus();
      });
    }
  }, [content]);

  const insertTable = useCallback(() => {
    const table = '\n| Столбец 1 | Столбец 2 | Столбец 3 |\n|-----------|-----------|----------|\n| Ячейка    | Ячейка    | Ячейка   |\n| Ячейка    | Ячейка    | Ячейка   |\n';
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const newContent = content.substring(0, pos) + table + content.substring(pos);
    setContent(newContent);
  }, [content]);

  const handleMarkdownImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (content.trim()) {
        if (confirm('Заменить текущее содержимое? Нажмите "Отмена" чтобы добавить в конец.')) {
          setContent(text);
        } else {
          setContent(content + '\n\n' + text);
        }
      } else {
        setContent(text);
      }
      if (!title || title === 'Новая статья') {
        const firstLine = text.split('\n')[0];
        const match = firstLine.match(/^#\s+(.+)/);
        if (match) setTitle(match[1].trim());
        else if (file.name.endsWith('.md')) setTitle(file.name.replace(/\.md$/, ''));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
      return;
    }
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      insertAtCursor('**', '**', 'жирный');
      return;
    }
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      insertAtCursor('*', '*', 'курсив');
      return;
    }

    if (e.key === 'Enter') {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = ta.selectionStart;
      const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
      const currentLine = content.substring(lineStart, pos);

      const bulletMatch = currentLine.match(/^(\s*)([-*])\s/);
      if (bulletMatch) {
        const lineContent = currentLine.replace(/^(\s*)([-*])\s/, '').trim();
        if (!lineContent) {
          e.preventDefault();
          const newContent = content.substring(0, lineStart) + content.substring(pos);
          setContent(newContent);
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart; });
          return;
        }
        e.preventDefault();
        const prefix = `\n${bulletMatch[1]}${bulletMatch[2]} `;
        const newContent = content.substring(0, pos) + prefix + content.substring(pos);
        setContent(newContent);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + prefix.length; });
        return;
      }

      const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (orderedMatch) {
        const lineContent = currentLine.replace(/^(\s*)(\d+)\.\s/, '').trim();
        if (!lineContent) {
          e.preventDefault();
          const newContent = content.substring(0, lineStart) + content.substring(pos);
          setContent(newContent);
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart; });
          return;
        }
        e.preventDefault();
        const nextNum = parseInt(orderedMatch[2]) + 1;
        const prefix = `\n${orderedMatch[1]}${nextNum}. `;
        const newContent = content.substring(0, pos) + prefix + content.substring(pos);
        setContent(newContent);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + prefix.length; });
        return;
      }

      const checkMatch = currentLine.match(/^(\s*)- \[([ x])\]\s/);
      if (checkMatch) {
        const lineContent = currentLine.replace(/^(\s*)- \[([ x])\]\s/, '').trim();
        if (!lineContent) {
          e.preventDefault();
          const newContent = content.substring(0, lineStart) + content.substring(pos);
          setContent(newContent);
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart; });
          return;
        }
        e.preventDefault();
        const prefix = `\n${checkMatch[1]}- [ ] `;
        const newContent = content.substring(0, pos) + prefix + content.substring(pos);
        setContent(newContent);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + prefix.length; });
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = ta.selectionStart;
      const newContent = content.substring(0, pos) + '  ' + content.substring(pos);
      setContent(newContent);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + 2; });
    }
  };

  const toolbarActions: (ToolbarAction | 'sep')[] = [
    { icon: Bold, label: 'Жирный (Ctrl+B)', action: () => insertAtCursor('**', '**', 'жирный') },
    { icon: Italic, label: 'Курсив (Ctrl+I)', action: () => insertAtCursor('*', '*', 'курсив') },
    { icon: Strikethrough, label: 'Зачёркнутый', action: () => insertAtCursor('~~', '~~', 'зачёркнутый') },
    'sep',
    { icon: Heading1, label: 'Заголовок 1', action: () => wrapLine('# ') },
    { icon: Heading2, label: 'Заголовок 2', action: () => wrapLine('## ') },
    { icon: Heading3, label: 'Заголовок 3', action: () => wrapLine('### ') },
    'sep',
    { icon: List, label: 'Маркированный список', action: () => wrapLine('- ') },
    { icon: ListOrdered, label: 'Нумерованный список', action: () => wrapLine('1. ') },
    { icon: CheckSquare, label: 'Чек-лист', action: () => wrapLine('- [ ] ') },
    'sep',
    { icon: Code, label: 'Код', action: () => insertAtCursor('`', '`', 'код') },
    { icon: Quote, label: 'Цитата', action: () => wrapLine('> ') },
    { icon: Minus, label: 'Разделитель', action: () => insertAtCursor('\n---\n') },
    { icon: Table, label: 'Таблица', action: insertTable },
    { icon: LinkIcon, label: 'Ссылка', action: () => insertAtCursor('[', '](url)', 'текст ссылки') },
    { icon: Image, label: 'Изображение', action: () => insertAtCursor('![', '](url)', 'описание') },
    'sep',
    { icon: FileUp, label: 'Импорт .md файла', action: handleMarkdownImport },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Top bar */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/knowledge')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Заголовок статьи"
            className="w-full text-xl font-bold text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(!preview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${preview ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            {preview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? 'Редактор' : 'Предпросмотр'}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Сохранение...' : saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Meta bar */}
      <div className="border-b border-slate-200 px-4 py-2.5 flex items-center gap-4 flex-wrap bg-slate-50">
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-500">
          <option value="">Без категории</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex items-center gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-medium">
              #{tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-blue-800"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <div className="flex items-center">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
              placeholder="+ тег"
              className="w-20 text-xs border-none bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="rounded" />
            <Pin className="w-3.5 h-3.5" /> Закрепить
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
            <Globe className="w-3.5 h-3.5" /> Публичная
          </label>
          {isPublic && slug && (
            <button onClick={handleCopyLink} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600">
              {linkCopied ? <Check className="w-3 h-3" /> : <Link className="w-3 h-3" />}
              {linkCopied ? 'Скопировано' : 'Копировать ссылку'}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {!preview && (
        <div className="border-b border-slate-200 px-4 py-1.5 flex items-center gap-0.5 bg-slate-50 overflow-x-auto">
          {toolbarActions.map((item, i) => {
            if (item === 'sep') return <div key={`sep-${i}`} className="w-px h-5 bg-slate-200 mx-1" />;
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={item.action}
                title={item.label}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {preview ? (
            <div className="prose prose-slate max-w-none p-8">
              {(() => { checkboxCountRef.current = 0; return null; })()}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }: any) {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return (
                        <div className="relative group">
                          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-sm">
                            <code className={className} {...props}>{children}</code>
                          </pre>
                          <button onClick={() => navigator.clipboard.writeText(String(children))}
                            className="absolute top-2 right-2 p-1.5 bg-slate-700 text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-600">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }
                    return <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
                  },
                  input({ type, checked, ...props }: any) {
                    if (type === 'checkbox') {
                      const idx = checkboxCountRef.current++;
                      return (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheckbox(idx)}
                          className="mr-2 rounded cursor-pointer accent-blue-500"
                        />
                      );
                    }
                    return <input {...props} />;
                  },
                  table({ children, ...props }: any) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="border-collapse border border-slate-300" {...props}>{children}</table>
                      </div>
                    );
                  },
                  th({ children, ...props }: any) {
                    return <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left text-sm font-semibold" {...props}>{children}</th>;
                  },
                  td({ children, ...props }: any) {
                    return <td className="border border-slate-300 px-3 py-2 text-sm" {...props}>{children}</td>;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'Начните писать...\n\nИспользуйте панель инструментов выше или горячие клавиши:\n  Ctrl+B — жирный\n  Ctrl+I — курсив\n  Ctrl+S — сохранить\n\nMarkdown поддерживается полностью:\n  # Заголовок\n  - Список\n  - [ ] Чеклист\n  1. Нумерация\n  > Цитата\n  ```код```\n  | Таблица |'}
              className="w-full h-full p-8 text-sm font-mono text-slate-800 bg-white border-none outline-none resize-none leading-relaxed"
            />
          )}
        </div>

        {/* Right panel - attachments */}
        <div className="w-64 border-l border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4" /> Файлы
            </span>
            <label className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer">
              <Upload className="w-4 h-4" />
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {uploading && <div className="text-xs text-slate-400 text-center py-2">Загрузка...</div>}
            {attachments.length === 0 && !uploading && (
              <p className="text-xs text-slate-400 text-center py-4">Нет файлов</p>
            )}
            {attachments.map(att => (
              <div key={att.id} className="bg-white rounded-lg border border-slate-200 p-2 text-xs group">
                <div className="font-medium text-slate-700 truncate mb-1">{att.originalName}</div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{(att.size / 1024).toFixed(0)} KB</span>
                  <div className="flex gap-1">
                    <a href={`/api/attachments/${att.id}/download`} target="_blank" rel="noreferrer"
                      className="p-1 hover:text-blue-500 rounded"><Download className="w-3 h-3" /></a>
                    <button onClick={() => handleDeleteAttachment(att.id)}
                      className="p-1 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
