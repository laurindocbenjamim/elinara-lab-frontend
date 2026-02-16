import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

// Declare Google type for TypeScript
declare global {
  interface Window {
    google?: any;
  }
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, status } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      navigate('/dashboard');
    }
  }, [status, navigate]);


  // Google Sign-In is now handled server-side via backend OAuth flow
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authService.login(formData);
      if (response.success || response.access_token || response.status_code === 200) {
        await login(response.access_token || '');
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  // Trigger Google Sign-In via backend OAuth flow
  const handleGoogleLogin = () => {
    authService.googleLogin();
  };

  return (
    <div className="min-h-[100vh] flex items-center justify-center bg-[#050505] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="max-w-md w-full space-y-8 animate-fade-in relative z-10">
        {/* Glass morphism card */}
        <div className="rounded-2xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl bg-[rgba(10,10,12,0.6)]">
          <div className="text-center -mb-3">
            <h2 className="text-4xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">Elinara Labs</h2>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/30 p-3 rounded-lg animate-pulse">
                {error}
              </div>
            )}

            {/* Email/Username Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                placeholder="Email or username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-lg text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-black/20 border-t-black rounded-full"></div>
                  INITIALIZING...
                </span>
              ) : (
                'TOUCH THE FUTURE'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white/5 text-zinc-400">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            {/* Fallback Google Button if GSI doesn't load */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-300"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => authService.microsoftLogin()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-300"
            >
              <svg className="h-5 w-5" viewBox="0 0 23 23" fill="currentColor">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span>Microsoft</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-white hover:text-zinc-200 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
