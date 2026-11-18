import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';
import { Loader2, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { FormError } from './kit';
import { btnIcon, btnPrimary, btnSecondary, errorMessage, inputCls, labelCls } from '../lib/ui';

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

  const doLogin = async (u: string, p: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.login(u, p);
      toast.success(`Selamat datang, ${data.user.username}.`);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(errorMessage(err, 'Username atau password salah. Cek lagi lalu coba masuk ulang.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Isi username dan password terlebih dahulu.');
      return;
    }
    doLogin(username, password);
  };

  const quickLogin = (u: string) => {
    setUsername(u);
    setPassword(u);
    doLogin(u, u);
  };

  const invalid = !!error;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
        <span className="text-lg font-extrabold tracking-tight">
          Space<span className="text-primary">Hub</span>
        </span>
        <button
          type="button"
          id="login-theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Pakai tema terang' : 'Pakai tema gelap'}
          className={btnIcon}
        >
          {theme === 'dark' ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <div id="login-card" className="w-full max-w-sm">
          <h1 id="login-header-title" className="text-2xl font-extrabold tracking-tight">
            Masuk ke panel inventaris
          </h1>
          <p id="login-header-subtitle" className="mt-2 text-sm text-muted-foreground">
            Kelola aset, peminjaman, dan perawatan peralatan di lokasi SpaceHub.
          </p>

          <form id="login-form" onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {error && (
              <FormError id="login-error-container">
                <span id="login-error-message">{error}</span>
              </FormError>
            )}

            <div>
              <label id="username-label" htmlFor="username-input" className={labelCls}>
                Username
              </label>
              <input
                id="username-input"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={invalid}
                className={inputCls}
                disabled={loading}
              />
            </div>

            <div>
              <label id="password-label" htmlFor="password-input" className={labelCls}>
                Password
              </label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={invalid}
                className={inputCls}
                disabled={loading}
              />
            </div>

            <button id="login-submit-btn" type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Memeriksa...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-semibold">Masuk cepat dengan akun uji coba</p>
            <p className="mt-1 text-xs text-muted-foreground">Dibuat oleh seed database. Password sama dengan username.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button id="login-quick-demo-btn" type="button" onClick={() => quickLogin('demo')} disabled={loading} className={btnSecondary}>
                Akun demo
              </button>
              <button id="login-quick-admin-btn" type="button" onClick={() => quickLogin('admin')} disabled={loading} className={btnSecondary}>
                Akun admin
              </button>
            </div>
          </div>
        </div>
      </main>
      </div>

      <figure className="relative hidden bg-muted lg:block">
        {/* Foto memberi konteks: panel ini mengurus meja, kursi, dan peralatan di ruang kerja SpaceHub. */}
        <img
          src="/images/dedicated-desk.jpg"
          alt="Meja dan kursi kerja di dalam bilik kaca"
          width={1600}
          height={1067}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <figcaption className="absolute bottom-4 left-4 rounded-md bg-foreground/80 px-2.5 py-1 text-xs text-background">
          Foto ilustrasi
        </figcaption>
      </figure>
    </div>
  );
};
