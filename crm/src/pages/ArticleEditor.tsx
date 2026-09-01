import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { KBCategory, KBArticle, Attachment } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Save, ArrowLeft, Eye, Edit3, Globe, Pin, Tag, X, Plus,
  Paperclip, Upload, Download, Trash2, Copy, Link, Check
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

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/kb/${user?.uid}/${slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white">
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

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {preview ? (
            <div className="prose prose-slate max-w-none p-8">
              <ReactMarkdown
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
                      return <input type="checkbox" checked={checked} readOnly className="mr-2 rounded" />;
                    }
                    return <input {...props} />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Начните писать в формате Markdown...&#10;&#10;# Заголовок&#10;## Подзаголовок&#10;- Список&#10;- [ ] Чеклист&#10;```js&#10;// Код&#10;```"
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
