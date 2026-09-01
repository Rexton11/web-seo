import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Copy, ArrowLeft, ChevronRight } from 'lucide-react';

interface PublicData {
  categories: any[];
  articles: any[];
  agencyName: string | null;
}

export default function PublicArticle() {
  const { userId, slug } = useParams<{ userId: string; slug?: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [listData, setListData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (slug) {
        const res = await fetch(`/api/kb/public/${userId}/${slug}`);
        if (res.ok) setArticle(await res.json());
      } else {
        const res = await fetch(`/api/kb/public/${userId}`);
        if (res.ok) setListData(await res.json());
      }
      setLoading(false);
    };
    load();
  }, [userId, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (slug && article) {
    const agencyName = article.agencyName || 'База знаний';
    const parsedTags = typeof article.tags === 'string' ? JSON.parse(article.tags) : (article.tags || []);
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => navigate(`/kb/${userId}`)} className="flex items-center gap-2 text-slate-600 hover:text-blue-500 text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              {agencyName}
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-10">
          <button onClick={() => navigate(`/kb/${userId}`)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-blue-500 mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Все статьи
          </button>

          <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{article.title}</h1>

          {parsedTags.length > 0 && (
            <div className="flex items-center gap-1.5 mb-8">
              {parsedTags.map((tag: string) => (
                <span key={tag} className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-medium">#{tag}</span>
              ))}
            </div>
          )}

          <div className="prose prose-slate max-w-none">
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
              {article.content || ''}
            </ReactMarkdown>
          </div>
        </main>

        <footer className="border-t border-slate-200 py-8 mt-16">
          <div className="max-w-3xl mx-auto px-6 text-center text-sm text-slate-400">
            {agencyName}
          </div>
        </footer>
      </div>
    );
  }

  if (!slug && listData) {
    const agencyName = listData.agencyName || 'База знаний';
    const grouped: Record<string, any[]> = {};
    for (const a of listData.articles) {
      const catId = a.categoryId || 'uncategorized';
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(a);
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{agencyName}</h1>
                <p className="text-sm text-slate-500">База знаний</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-8">
          {listData.categories.map(cat => {
            const catArticles = grouped[cat.id] || [];
            if (catArticles.length === 0) return null;
            return (
              <div key={cat.id} className="mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-3">{cat.name}</h2>
                <div className="space-y-2">
                  {catArticles.map((a: any) => (
                    <button key={a.id} onClick={() => navigate(`/kb/${userId}/${a.slug}`)}
                      className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between group">
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">{a.title}</h3>
                        {a.content && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{a.content.replace(/[#*`>\-\[\]]/g, '').slice(0, 100)}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {listData.articles.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Пока нет публичных статей</p>
            </div>
          )}
        </main>

        <footer className="border-t border-slate-200 py-8">
          <div className="max-w-3xl mx-auto px-6 text-center text-sm text-slate-400">
            {agencyName}
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center text-slate-400">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Страница не найдена</p>
      </div>
    </div>
  );
}
