import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const LoginForm: React.FC = () => {
  const { signIn, setDemoUser, isDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Invalid email or password. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md shadow-blue-500/20 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Attendance Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access your school registers and records
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              School Email Address
            </label>
            <div className="relative">
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Sign In
          </button>
        </form>

        {/* Quick Testing Sandbox Bar (For testing both roles immediately) */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-center text-slate-500 font-medium mb-3">
            Instant Test Accounts (Click to test roles)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoUser('admin')}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Role</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('teacher')}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Teacher Role</span>
            </button>
          </div>
          {isDemoMode && (
            <p className="mt-3 text-[11px] text-center text-slate-400">
              Running in sandbox preview. Connect your Supabase keys in <code className="text-slate-600">.env</code> to use live cloud Auth.
            </p>
          )}
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
