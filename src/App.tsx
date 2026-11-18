import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { DashboardOverview } from './components/DashboardOverview';
import { AssetsManager } from './components/AssetsManager';
import { CategoriesManager } from './components/CategoriesManager';
import { AssignmentsManager } from './components/AssignmentsManager';
import { MaintenanceManager } from './components/MaintenanceManager';
import { LoadingState } from './components/kit';
import { Toaster } from 'react-hot-toast';
import type { User } from './types';

type Theme = 'light' | 'dark';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  user: User | null;
  logout: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

function ProtectedRoute({ isAuthenticated, user, logout, theme, toggleTheme }: ProtectedRouteProps) {
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme}>
      <Outlet />
    </Layout>
  );
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage bisa diblokir; jatuh ke preferensi sistem
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const { user, isAuthenticated, logout, isLoadingProfile, refetchProfile } = useAuth();
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // abaikan, tema tetap berlaku untuk sesi ini
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  if (isLoadingProfile) {
    return (
      <main id="app-loader" className="flex min-h-dvh items-center justify-center">
        <LoadingState>Memeriksa sesi login...</LoadingState>
      </main>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--popover)',
            color: 'var(--popover-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--popover)' } },
          error: { iconTheme: { primary: 'var(--destructive)', secondary: 'var(--popover)' } },
        }}
      />
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLoginSuccess={() => refetchProfile()} theme={theme} toggleTheme={toggleTheme} />
              )
            }
          />

          <Route
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            }
          >
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/assets" element={<AssetsManager />} />
            <Route path="/categories" element={<CategoriesManager />} />
            <Route path="/assignments" element={<AssignmentsManager />} />
            <Route path="/maintenance" element={<MaintenanceManager />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
