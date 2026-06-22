import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { KeyRound, User as UserIcon, AlertCircle, Loader2, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, toggleTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setError(null);
    setLoading(true);

    try {
      const data = await authService.login(userVal, passVal);
      toast.success(data.message || 'Login successful!');
      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Invalid username or password. Please check your credentials.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      toast.error('Username and password are required.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      toast.success(data.message || 'Login successful!');
      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Invalid username or password. Please check your credentials.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4 transition-colors duration-200">
      {/* Decorative Glow Elements (only visible in dark theme) */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none dark:opacity-100 opacity-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none dark:opacity-100 opacity-0" />

      {/* Floating Theme Toggle in Login Screen */}
      <div className="absolute top-6 right-6 z-20">
        <button
          id="login-theme-toggle-btn"
          onClick={toggleTheme}
          className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md transition-all cursor-pointer text-slate-800 dark:text-slate-200"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>

      {/* Main Login Card */}
      <div 
        id="login-card"
        className="w-full max-w-md bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 transition-all duration-300"
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            id="login-logo-container"
            className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl shadow-lg shadow-purple-500/20 mb-4"
          >
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 id="login-header-title" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CoSpace Admin Portal</h2>
          <p id="login-header-subtitle" className="text-sm text-slate-550 dark:text-slate-400 mt-2 font-light">
            Sign in to manage coworking space equipment & assets
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div 
            id="login-error-container"
            className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start space-x-3 text-red-800 dark:text-red-200 text-sm animate-shake"
          >
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <span id="login-error-message">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Username Input */}
          <div className="space-y-2">
            <label 
              id="username-label"
              htmlFor="username-input" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="username-input"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-sm"
                placeholder="Enter admin username"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label 
              id="password-label"
              htmlFor="password-input"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-sm"
                placeholder="Enter account password"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10 mt-2 hover:shadow-purple-500/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Access Demo Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col space-y-3">
          <p className="text-center text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Demo & Test Access
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="login-quick-demo-btn"
              type="button"
              onClick={() => handleQuickLogin('demo', 'demo')}
              disabled={loading}
              className="py-2.5 px-3 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-800/40 text-purple-600 dark:text-purple-400 font-semibold rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
            >
              <span>Demo Account</span>
            </button>
            <button
              id="login-quick-admin-btn"
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin')}
              disabled={loading}
              className="py-2.5 px-3 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-800/40 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
            >
              <span>Admin Account</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center">
          <p id="login-footer-text" className="text-xs text-slate-400 dark:text-slate-500 font-light">
            Secured administrator environment. Unauthorized access is recorded.
          </p>
        </div>
      </div>
    </div>
  );
};
