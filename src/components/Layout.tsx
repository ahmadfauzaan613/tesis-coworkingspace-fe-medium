import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { authService } from '../services/authService';
import { User as UserType } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Send, 
  Wrench, 
  LogOut, 
  Menu, 
  X, 
  Database,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

interface LayoutProps {
  user: UserType;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  theme,
  toggleTheme,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Poll backend status check (online database check)
  const { data: systemStatus } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: async () => {
      const res = await api.get('/status');
      return res.data;
    },
    refetchInterval: 10000 // poll status check every 10s
  });

  const dbConnected = systemStatus?.database === 'Connected';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Stats', icon: LayoutDashboard },
    { id: 'assets', label: 'Equipment Catalog', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'assignments', label: 'Checkout & Loans', icon: Send },
    { id: 'maintenance', label: 'Maintenance Log', icon: Wrench },
  ];

  const handleTabSelect = (tabId: string) => {
    navigate('/' + tabId);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    authService.logout();
    onLogout();
    navigate('/');
  };

  return (
    <div 
      id="admin-dashboard-container"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex selection:bg-purple-500 selection:text-white antialiased transition-colors duration-200"
    >
      
      {/* ==================================================== */}
      {/* DESKTOP SIDEBAR WRAPPER */}
      {/* ==================================================== */}
      <aside 
        id="desktop-sidebar"
        className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl shrink-0 h-screen sticky top-0"
      >
        
        {/* Sidebar Header Logo */}
        <div id="sidebar-logo" className="p-6 border-b border-slate-200 dark:border-slate-900 flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/10">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">CoSpace Assets</h1>
            <span className="text-[10px] text-slate-500 font-light mt-1 block">Inventory Control v1.0</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === '/' + item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleTabSelect(item.id)}
                className={`w-full flex items-center space-x-3 py-3 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-purple-550 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin profile & DB status card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-900 space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
          
          {/* Theme toggler row */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 px-3 py-2 rounded-xl text-[10px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Dashboard Theme</span>
            <button
              id="sidebar-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg border border-slate-250 dark:border-slate-800 transition cursor-pointer text-slate-800 dark:text-slate-200"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
          </div>

          {/* Connection status */}
          <div 
            id="db-connectivity-status"
            className="flex items-center justify-between bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 p-2.5 rounded-xl text-[10px]"
          >
            <div className="flex items-center space-x-2">
              <Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-slate-500 dark:text-slate-400">PostgreSQL Schema</span>
            </div>
            <span 
              id="db-connectivity-state-text"
              className={`inline-flex items-center space-x-1 font-bold ${dbConnected ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dbConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span>{dbConnected ? 'Online' : 'Offline'}</span>
            </span>
          </div>

          {/* Profile badge details */}
          <div 
            id="sidebar-profile-card"
            className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-900"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div 
                id="sidebar-user-avatar"
                className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-650 dark:text-purple-400 shrink-0 font-bold text-xs uppercase"
              >
                {user.username.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p id="sidebar-user-username" className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate leading-none">{user.username}</p>
                <span id="sidebar-user-role" className="text-[10px] text-slate-400 dark:text-slate-500 font-light truncate mt-0.5 block capitalize">{user.role}</span>
              </div>
            </div>
            <button
              id="sidebar-logout-btn"
              onClick={handleSignOut}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-450 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </aside>

      {/* ==================================================== */}
      {/* MOBILE HEADER & DRAWER NAV */}
      {/* ==================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Mobile Header Nav */}
        <header 
          id="mobile-header"
          className="lg:hidden h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">CoSpace Assets</h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Mobile Header Theme Toggle */}
            <button
              id="mobile-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-955 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl transition cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-550" />}
            </button>
            <button
              id="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-955 dark:hover:text-white bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-250 dark:border-slate-800 transition"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile slide drawer */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-nav-drawer"
            className="lg:hidden fixed inset-0 z-40 bg-white dark:bg-slate-950 flex flex-col animate-fadeIn"
          >
            <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Navigation Menu</span>
              <button 
                id="mobile-nav-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav id="mobile-nav-menu" className="flex-1 p-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === '/' + item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    onClick={() => handleTabSelect(item.id)}
                    className={`w-full flex items-center space-x-4 py-3.5 px-5 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'
                        : 'text-slate-550 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-purple-550 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/20 space-y-4">
              
              <div 
                id="mobile-db-status"
                className="flex items-center justify-between text-xs bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-900"
              >
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-slate-400 dark:text-slate-550" />
                  <span className="text-slate-500 dark:text-slate-400">DB Connectivity Status</span>
                </div>
                <span className={`font-bold ${dbConnected ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-450'}`}>
                  {dbConnected ? 'Online' : 'Offline'}
                </span>
              </div>

              <div 
                id="mobile-profile-card"
                className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-650 dark:text-purple-400 font-bold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-none">{user.username}</p>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 block capitalize">{user.role}</span>
                  </div>
                </div>
                <button
                  id="mobile-logout-btn"
                  onClick={handleSignOut}
                  className="py-1.5 px-3 bg-rose-50 dark:bg-rose-955/30 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 hover:bg-rose-100 dark:hover:text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main 
          id="main-content-slot"
          className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto"
        >
          {children}
        </main>

      </div>

    </div>
  );
};
