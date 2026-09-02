import React from 'react';
import { NavLink } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Users, BookOpen, Settings, LogOut, CheckSquare, BarChart3 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

export default function Sidebar() {
  const { logOut, user } = useAuth();
  const { settings } = useSettings();

  const navItems = [
    { name: 'Воронка продаж', to: '/', icon: LayoutDashboard },
    { name: 'Задачи', to: '/tasks', icon: CheckSquare },
    { name: 'SEO Отчёты', to: '/seo', icon: BarChart3 },
    { name: 'Клиенты', to: '/clients', icon: Users },
    { name: 'База знаний', to: '/knowledge', icon: BookOpen },
    { name: 'Настройки', to: '/settings', icon: Settings },
  ];

  const crmTitle = settings?.crmTitle || 'B2B CRM';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full no-print">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        {settings?.crmFavicon ? (
          <img src={settings.crmFavicon} alt="" className="w-8 h-8 rounded-lg object-contain" />
        ) : (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight leading-none">{crmTitle}</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">AI Sales Tool</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-slate-800/50 rounded-md">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.displayName || 'Пользователь'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'Скрытый email'}</p>
          </div>
        </div>
        <button
          onClick={logOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
