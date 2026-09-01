import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { KBCategory, KBArticle } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, BookOpen, FileText, Globe, Pin, Trash2, Edit3, FolderOpen,
  Tag, Eye, ChevronRight, Settings, GripVertical, X, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  FileText, BookOpen, FolderOpen, Settings, Tag, Globe, Eye, Edit3,
};

const DEFAULT_CATEGORIES = [
  { name: 'Процессы', slug: 'processy', icon: 'Settings', isPublic: false, order: 0 },
  { name: 'Шаблоны', slug: 'shablony', icon: 'FileText', isPublic: false, order: 1 },
  { name: 'Техническое', slug: 'tekhnicheskoe', icon: 'FolderOpen', isPublic: false, order: 2 },
  { name: 'Продажи', slug: 'prodazhi', icon: 'Tag', isPublic: false, order: 3 },
  { name: 'Клиентам', slug: 'klientam', icon: 'Globe', isPublic: true, order: 4 },
];

function slugify(str: string): string {
  const ru: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',к:'k',
    л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',
    ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return str.toLowerCase().split('').map(c => ru[c] || c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function KnowledgeBase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryPublic, setNewCategoryPublic] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const getToken = async () => user ? await user.getIdToken() : '';

  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/kb/categories', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          await initDefaults(token);
          return;
        }
        setCategories(data);
      }
    } catch (e) { console.error(e); }
  };

  const initDefaults = async (token: string) => {
    for (const cat of DEFAULT_CATEGORIES) {
      await fetch('/api/kb/categories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
    }
    const res = await fetch('/api/kb/categories', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCategories(await res.json());
  };

  const fetchArticles = async (categoryId?: string, q?: string) => {
    try {
      const token = await getToken();
      let url = '/api/kb/articles';
      const params = new URLSearchParams();
      if (categoryId) params.set('categoryId', categoryId);
      if (q) params.set('q', q);
      if (params.toString()) url += `?${params}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: KBArticle[] = await res.json();
        setArticles(data.map(a => ({
          ...a,
          tags: typeof a.tags === 'string' ? JSON.parse(a.tags as any) : (a.tags || [])
        })));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (user) {
      fetchCategories().then(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchArticles(selectedCategoryId || undefined, searchQuery || undefined);
  }, [selectedCategoryId, searchQuery, user]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const token = await getToken();
    const res = await fetch('/api/kb/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCategoryName,
        slug: slugify(newCategoryName),
        isPublic: newCategoryPublic,
        order: categories.length,
      }),
    });
    if (res.ok) {
      setNewCategoryName('');
      setNewCategoryPublic(false);
      setShowNewCategory(false);
      fetchCategories();
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const token = await getToken();
    await fetch(`/api/kb/categories/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editCategoryName, slug: slugify(editCategoryName) }),
    });
    setEditingCategoryId(null);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию и все её статьи?')) return;
    const token = await getToken();
    await fetch(`/api/kb/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (selectedCategoryId === id) setSelectedCategoryId(null);
    fetchCategories();
    fetchArticles();
  };

  const handleToggleCategoryPublic = async (cat: KBCategory) => {
    const token = await getToken();
    await fetch(`/api/kb/categories/${cat.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !cat.isPublic }),
    });
    fetchCategories();
  };

  const handleCreateArticle = async () => {
    const token = await getToken();
    const title = 'Новая статья';
    const res = await fetch('/api/kb/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug: slugify(title) + '-' + Date.now(),
        categoryId: selectedCategoryId || (categories[0]?.id ?? null),
        content: '',
        tags: [],
      }),
    });
    if (res.ok) {
      const article = await res.json();
      navigate(`/knowledge/${article.id}/edit`);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Удалить статью?')) return;
    const token = await getToken();
    await fetch(`/api/kb/articles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchArticles(selectedCategoryId || undefined, searchQuery || undefined);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const filteredArticles = articles;
  const articleCountByCategory = (catId: string) => articles.filter(a => a.categoryId === catId).length;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>;

  return (
    <div className="flex h-full">
      {/* Categories sidebar */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            База знаний
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategoryId ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Все статьи
          </button>

          {categories.map(cat => {
            const IconComp = ICON_MAP[cat.icon || 'FileText'] || FileText;
            return (
              <div key={cat.id} className="group relative">
                {editingCategoryId === cat.id ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      value={editCategoryName}
                      onChange={e => setEditCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                      className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button onClick={() => handleUpdateCategory(cat.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingCategoryId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategoryId === cat.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span className="flex-1 text-left truncate">{cat.name}</span>
                    {cat.isPublic && <Globe className="w-3 h-3 text-green-500" />}
                    <span className="text-xs text-slate-400">{articleCountByCategory(cat.id)}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                      <button onClick={e => { e.stopPropagation(); setEditingCategoryId(cat.id); setEditCategoryName(cat.name); }}
                        className="p-0.5 text-slate-400 hover:text-blue-500 rounded"><Edit3 className="w-3 h-3" /></button>
                      <button onClick={e => { e.stopPropagation(); handleToggleCategoryPublic(cat); }}
                        className="p-0.5 text-slate-400 hover:text-green-500 rounded"><Globe className="w-3 h-3" /></button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                        className="p-0.5 text-slate-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showNewCategory ? (
          <div className="p-3 border-t border-slate-200 space-y-2">
            <input
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
              placeholder="Название категории"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={newCategoryPublic} onChange={e => setNewCategoryPublic(e.target.checked)} className="rounded" />
              Публичная (для клиентов)
            </label>
            <div className="flex gap-2">
              <button onClick={handleCreateCategory} className="flex-1 bg-blue-500 text-white text-sm py-1.5 rounded-lg hover:bg-blue-600">Создать</button>
              <button onClick={() => setShowNewCategory(false)} className="flex-1 bg-slate-100 text-slate-600 text-sm py-1.5 rounded-lg hover:bg-slate-200">Отмена</button>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-200">
            <button onClick={() => setShowNewCategory(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-500 hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4" /> Категория
            </button>
          </div>
        )}
      </div>

      {/* Articles list */}
      <div className="flex-1 bg-slate-50 flex flex-col">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по статьям..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
          <button
            onClick={handleCreateArticle}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Новая статья
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedCategory && (
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
              <span>Категория:</span>
              <span className="font-medium text-slate-700">{selectedCategory.name}</span>
              {selectedCategory.isPublic && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Публичная</span>}
            </div>
          )}

          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Нет статей{selectedCategory ? ` в категории "${selectedCategory.name}"` : ''}</p>
              <button onClick={handleCreateArticle} className="mt-3 text-sm text-blue-500 hover:text-blue-600">Создать первую статью</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArticles.map(article => {
                const cat = categories.find(c => c.id === article.categoryId);
                return (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/knowledge/${article.id}`)}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {article.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                          <h3 className="font-semibold text-slate-900 truncate">{article.title}</h3>
                          {article.isPublic && <Globe className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                        </div>
                        {article.content && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                            {article.content.replace(/[#*`>\-\[\]]/g, '').slice(0, 150)}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {cat && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{cat.name}</span>}
                          {(article.tags || []).slice(0, 3).map((tag: string) => (
                            <span key={tag} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">#{tag}</span>
                          ))}
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views}</span>
                          <span>{format(new Date(article.updatedAt), 'd MMM yyyy', { locale: ru })}</span>
                        </div>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); navigate(`/knowledge/${article.id}/edit`); }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteArticle(article.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
