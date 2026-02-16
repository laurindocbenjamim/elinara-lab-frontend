import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api'; // Use authService for public registration
import { RegisterRequest } from '../types';
import { User as UserIcon, Mail, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { status } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      navigate('/dashboard');
    }
  }, [status, navigate]);
  // Using RegisterRequest structure directly for state
  const [formData, setFormData] = useState<RegisterRequest>({
    authEmail: '',
    authPassword: '',
    firstName: '',
    lastName: '',
    countryName: '',
    countryTelCode: '',
    phoneNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.register(formData);
      setShowSuccess(true);

      // Delay redirect to allow user to read the message
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful. Please check your email for confirmation code.' } });
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100vh] flex items-center justify-center bg-[#050505] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Success Popup Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
            <p className="text-gray-600 mb-6">
              Please check your inbox at <span className="font-semibold text-gray-800">{formData.authEmail}</span> to confirm your account.
            </p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 animate-[progress_5s_linear_forwards]" style={{ width: '100%' }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Redirecting to login...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Glass morphism card */}
        <div className="rounded-2xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl bg-[rgba(10,10,12,0.6)]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 border border-white/10 mb-4">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Create Account</h2>
          </div>

          {error && (
            <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/30 p-3 rounded-lg mb-6 animate-pulse">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  required
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                />
              </div>
              <div className="relative group">
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  required
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              </div>
              <input
                id="authEmail"
                name="authEmail"
                type="email"
                required
                placeholder="Email address"
                value={formData.authEmail}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              </div>
              <input
                id="authPassword"
                name="authPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                value={formData.authPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-black/20 border-t-black rounded-full"></div>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white hover:text-zinc-200 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
