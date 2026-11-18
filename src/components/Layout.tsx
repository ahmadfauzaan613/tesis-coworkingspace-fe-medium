import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { authService } from '../services/authService';
import type { User as UserType } from '../types';
import { ArrowLeftRight, LayoutDashboard, LogOut, Menu, Moon, Package, Sun, Tags, Wrench, X } from 'lucide-react';
import { btnIcon } from '../lib/ui';

interface LayoutProps {
  user: UserType;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  children: React.ReactNode;
}

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Ringkasan' },
  { id: 'assets', icon: Package, label: 'Aset' },
  { id: 'categories', icon: Tags, label: 'Kategori' },
  { id: 'assignments', icon: ArrowLeftRight, label: 'Peminjaman' },
  { id: 'maintenance', icon: Wrench, label: 'Perawatan' },
];

function Wordmark() {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-lg font-extrabold tracking-tight">
        Space<span className="text-primary">Hub</span>
      </span>
      <span className="text-sm font-semibold text-muted-foreground">Inventaris</span>
    </span>
  );
}

function NavItems({ mobile, onNavigate }: { mobile: boolean; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {menuItems.map((item) => (
        <li key={item.id}>
          <NavLink
            to={`/${item.id}`}
            id={mobile ? `mobile-nav-${item.id}` : `sidebar-nav-${item.id}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                isActive ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function SessionPanel({
  mobile,
  user,
  theme,
  toggleTheme,
  dbConnected,
  dbKnown,
  onSignOut,
}: {
  mobile: boolean;
  user: UserType;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  dbConnected: boolean;
  dbKnown: boolean;
  onSignOut: () => void;
}) {
  const dbLabel = !dbKnown ? 'Memeriksa...' : dbConnected ? 'Terhubung' : 'Terputus';
  return (
    <div className="space-y-1 border-t border-border pt-3">
      <div id={mobile ? 'mobile-db-status' : 'db-connectivity-status'} className="flex min-h-11 items-center justify-between px-2 text-sm">
        <span className="text-muted-foreground">Database</span>
        <span
          id={mobile ? undefined : 'db-connectivity-state-text'}
          role="status"
          className={`inline-flex items-center gap-2 font-semibold ${
            !dbKnown ? 'text-muted-foreground' : dbConnected ? 'text-success' : 'text-destructive'
          }`}
        >
          {/* Titik ini menandai status koneksi yang nyata (dicek tiap 10 detik), bukan hiasan. */}
          <span aria-hidden="true" className="size-2 rounded-full bg-current" />
          {dbLabel}
        </span>
      </div>

      {!mobile && (
        <button
          type="button"
          id="sidebar-theme-toggle-btn"
          onClick={toggleTheme}
          className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span>{theme === 'dark' ? 'Pakai tema terang' : 'Pakai tema gelap'}</span>
          {theme === 'dark' ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
        </button>
      )}

      <div id={mobile ? 'mobile-profile-card' : 'sidebar-profile-card'} className="flex items-center justify-between gap-2 px-2 pt-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            id={mobile ? undefined : 'sidebar-user-avatar'}
            aria-hidden="true"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold uppercase text-primary"
          >
            {user.username.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p id={mobile ? undefined : 'sidebar-user-username'} className="truncate text-sm font-semibold">
              {user.username}
            </p>
            <p id={mobile ? undefined : 'sidebar-user-role'} className="truncate text-xs capitalize text-muted-foreground">
              {user.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          id={mobile ? 'mobile-logout-btn' : 'sidebar-logout-btn'}
          onClick={onSignOut}
          aria-label="Keluar dari akun"
          title="Keluar"
          className={btnIcon}
        >
          <LogOut className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, theme, toggleTheme, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: systemStatus, isError } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: async () => (await api.get('/status')).data,
    refetchInterval: 10000,
  });
  const dbConnected = systemStatus?.database === 'Connected';
  const dbKnown = !!systemStatus || isError;

  const current = menuItems.find((m) => location.pathname === `/${m.id}`);
  useEffect(() => {
    document.title = `${current?.label ?? 'Inventaris'} | SpaceHub`;
  }, [current]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMobileMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  const handleSignOut = () => {
    authService.logout();
    onLogout();
    navigate('/');
  };

  const sessionProps = { user, theme, toggleTheme, dbConnected, dbKnown, onSignOut: handleSignOut };

  return (
    <div id="admin-dashboard-container" className="min-h-dvh lg:flex">
      <a
        href="#main-content-slot"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:font-semibold"
      >
        Lewati ke konten
      </a>

      <aside
        id="desktop-sidebar"
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-muted px-3 py-5 lg:flex"
      >
        <div id="sidebar-logo" className="px-2 pb-6">
          <Wordmark />
        </div>
        <nav id="sidebar-nav" aria-label="Menu utama" className="flex-1 overflow-y-auto">
          <NavItems mobile={false} />
        </nav>
        <SessionPanel mobile={false} {...sessionProps} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          id="mobile-header"
          className="sticky top-0 z-30 border-b border-border bg-background lg:hidden"
        >
          <div className="flex h-16 items-center justify-between px-4">
            <Wordmark />
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="mobile-theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Pakai tema terang' : 'Pakai tema gelap'}
                className={btnIcon}
              >
                {theme === 'dark' ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
              </button>
              <button
                type="button"
                id="mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen((o) => !o)}
                aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                className={btnIcon}
              >
                {isMobileMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div id="mobile-nav-drawer" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border px-3 pb-4 pt-2">
              <nav id="mobile-nav-menu" aria-label="Menu utama" className="pb-3">
                <NavItems mobile onNavigate={() => setIsMobileMenuOpen(false)} />
              </nav>
              <SessionPanel mobile {...sessionProps} />
            </div>
          )}
        </header>

        <main id="main-content-slot" tabIndex={-1} className="w-full flex-1 px-4 py-8 sm:px-6 md:py-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
};
