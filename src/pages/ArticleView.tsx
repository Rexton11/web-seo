import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { KBCategory, KBArticle } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, Edit3, Trash2, Globe, Pin, Eye, Copy, Link, Check,
  ChevronRight, ChevronLeft, BookOpen, Tag, ClipboardCopy, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [category, setCategory] = useState<KBCategory | null>(null);
  const [siblings, setSiblings] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [contentCopied, setContentCopied] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const checkboxCountRef = useRef(0);

  const getToken = async () => user ? await user.getIdToken() : '';

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      const token = await getToken();
      const artRes = await fetch(`/api/kb/articles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!artRes.ok) { setLoading(false); return; }
      const art = await artRes.json();
      art.tags = typeof art.tags === 'string' ? JSON.parse(art.tags) : (art.tags || []);
      setArticle(art);

      if (art.categoryId) {
        const [catRes, sibRes] = await Promise.all([
          fetch(`/api/kb/categories`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/kb/articles?categoryId=${art.categoryId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (catRes.ok) {
          const cats: KBCategory[] = await catRes.json();
          setCategory(cats.find(c => c.id === art.categoryId) || null);
        }
        if (sibRes.ok) setSiblings(await sibRes.json());
      }
      setLoading(false);
    };
    load();
  }, [user, id]);

  const handleDelete = async () => {
    if (!confirm('Удалить статью?')) return;
    const token = await getToken();
    await fetch(`/api/kb/articles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    navigate('/knowledge');
  };

  const handleCopyLink = () => {
    if (!article) return;
    const link = `${window.location.origin}/kb/${user?.uid}/${article.slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const toggleCheckbox = async (checkboxIndex: number) => {
    if (!article) return;
    const content = article.content || '';
    let count = 0;
    const newContent = content.replace(/- \[([ x])\]/g, (match, state) => {
      if (count++ === checkboxIndex) {
        return state === 'x' ? '- [ ]' : '- [x]';
      }
      return match;
    });
    setArticle({ ...article, content: newContent });
    const token = await getToken();
    await fetch(`/api/kb/articles/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });
  };

  const handleCopyContent = () => {
    if (!contentRef.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(contentRef.current);
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.execCommand('copy');
    selection?.removeAllRanges();
    setContentCopied(true);
    setTimeout(() => setContentCopied(false), 2000);
  };

  const handleCopyMarkdown = () => {
    if (!article?.content) return;
    navigator.clipboard.writeText(article.content);
    setMarkdownCopied(true);
    setTimeout(() => setMarkdownCopied(false), 2000);
  };

  const currentIdx = siblings.findIndex(a => a.id === id);
  const prevArticle = currentIdx > 0 ? siblings[currentIdx - 1] : null;
  const nextArticle = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>;
  if (!article) return <div className="flex items-center justify-center h-full text-slate-400">Статья не найдена</div>;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <button onClick={() => navigate('/knowledge')} className="hover:text-blue-500 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> База знаний
          </button>
          {category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => navigate('/knowledge')} className="hover:text-blue-500">{category.name}</button>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 truncate">{article.title}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{article.title}</h1>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={handleCopyContent} title="Копировать как текст"
                className={`p-2 rounded-lg transition-colors ${contentCopied ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                {contentCopied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
              </button>
              <button onClick={handleCopyMarkdown} title="Копировать Markdown"
                className={`p-2 rounded-lg transition-colors ${markdownCopied ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                {markdownCopied ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </button>
              <button onClick={() => navigate(`/knowledge/${id}/edit`)}
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
            {article.isPinned && <span className="flex items-center gap-1 text-amber-500"><Pin className="w-3 h-3" /> Закреплена</span>}
            {article.isPublic && (
              <button onClick={handleCopyLink} className="flex items-center gap-1 text-green-500 hover:text-green-600">
                {linkCopied ? <Check className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {linkCopied ? 'Ссылка скопирована' : 'Публичная'}
              </button>
            )}
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.views} просмотров</span>
            <span>Обновлено {format(new Date(article.updatedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}</span>
          </div>

          {(article.tags || []).length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              {article.tags.map((tag: string) => (
                <span key={tag} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-medium">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {(() => { checkboxCountRef.current = 0; return null; })()}
        <div ref={contentRef} className="prose prose-slate max-w-none mb-12">
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
              input({ type, checked, disabled, ...props }: any) {
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
            {article.content || ''}
          </ReactMarkdown>
        </div>

        {/* Prev/next navigation */}
        {(prevArticle || nextArticle) && (
          <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
            {prevArticle ? (
              <button onClick={() => navigate(`/knowledge/${prevArticle.id}`)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500">
                <ChevronLeft className="w-4 h-4" /> {prevArticle.title}
              </button>
            ) : <div />}
            {nextArticle ? (
              <button onClick={() => navigate(`/knowledge/${nextArticle.id}`)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500">
                {nextArticle.title} <ChevronRight className="w-4 h-4" />
              </button>
            ) : <div />}
          </div>
        )}
      </div>
    </div>
  );
}
