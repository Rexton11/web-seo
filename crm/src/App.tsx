import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DealView from './pages/DealView';
import ClientsList from './pages/ClientsList';
import ClientView from './pages/ClientView';
import Settings from './pages/Settings';
import KnowledgeBase from './pages/KnowledgeBase';
import ArticleView from './pages/ArticleView';
import ArticleEditor from './pages/ArticleEditor';
import PublicArticle from './pages/PublicArticle';

function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deal/:id" element={<DealView />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/client/:id" element={<ClientView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/knowledge/:id" element={<ArticleView />} />
          <Route path="/knowledge/:id/edit" element={<ArticleEditor />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isPublicKB = location.pathname.startsWith('/kb/');

  if (isPublicKB) {
    return (
      <Routes>
        <Route path="/kb/:userId" element={<PublicArticle />} />
        <Route path="/kb/:userId/:slug" element={<PublicArticle />} />
      </Routes>
    );
  }

  return <AppLayout />;
}
