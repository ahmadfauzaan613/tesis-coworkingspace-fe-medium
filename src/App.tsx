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
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  user: any;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

function ProtectedRoute({ isAuthenticated, user, logout, theme, toggleTheme }: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme}>
      <Outlet />
    </Layout>
  );
}

function App() {
  const { user, isAuthenticated, logout, isLoadingProfile, refetchProfile } = useAuth();
  
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Toggle dark class on root document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (isLoadingProfile) {
    return (
      <div 
        id="app-loader"
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400"
      >
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
        <p className="text-sm font-light">Authenticating admin portal session...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#0f172a' : '#ffffff',
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
            border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
            borderRadius: '16px',
            fontSize: '13px'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: theme === 'dark' ? '#0f172a' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: theme === 'dark' ? '#0f172a' : '#ffffff',
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login 
                  onLoginSuccess={() => refetchProfile()} 
                  theme={theme} 
                  toggleTheme={toggleTheme} 
                />
              )
            } 
          />

          {/* Protected Dashboard Admin Routes */}
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

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
