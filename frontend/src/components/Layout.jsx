import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarPlus, History,
  Users, Shield, LogOut, Menu, X, Bell, ChevronRight
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isAdmin   = ['admin', 'manager'].includes(user?.role);
  const initials  = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const navItems = [
    { path: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
    { path: '/apply-leave',   label: 'Apply Leave',   icon: CalendarPlus },
    { path: '/leave-history', label: 'My Leaves',     icon: History },
    ...(isAdmin ? [
      { path: '/admin',     label: 'Manage Leaves', icon: Shield },
      { path: '/employees', label: 'Employees',     icon: Users },
    ] : [])
  ];

  const Sidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-slate-900 text-white">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
        <div>
          <p className="text-sm font-bold tracking-wide text-indigo-400 uppercase">Leave Portal</p>
          <p className="text-xs text-slate-500 mt-0.5">HR Management System</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role} · {user?.department}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Menu</p>
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon size={17} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slide-in */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        transform transition-transform duration-200 ease-in-out flex-shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>

          {/* Page title from path */}
          <div className="flex-1 hidden sm:block">
            <h2 className="text-sm font-semibold text-gray-800">
              {navItems.find(n => n.path === location.pathname)?.label ?? 'Employee Leave Portal'}
            </h2>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors relative">
              <Bell size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
