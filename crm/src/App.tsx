import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DealView from './pages/DealView';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deal/:id" element={<DealView />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}
