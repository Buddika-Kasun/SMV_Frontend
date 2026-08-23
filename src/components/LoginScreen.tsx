import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound,
  Sparkles,
  CheckCircle2,
  Users
} from 'lucide-react';
import { User, UserRole } from '../types';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = userService.login(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        toast.success(`Welcome back, ${result.user.fullName}!`, {
          icon: '👋',
          duration: 3000,
        });
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    }, 250);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            SMV Holdings
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Micro Finance Management Enterprise Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-200">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Staff & Management Sign In</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Enter credentials to access authorized modules</p>
            </div>
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <span className="font-bold">•</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username (e.g. sysadmin)"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition font-mono text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Quick Test Accounts:
              </span>
              <span>Click to auto-fill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* Sysadmin */}
              <button
                type="button"
                onClick={() => handleQuickFill('sysadmin', 'admin123')}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">SysAdmin</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    admin
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-slate-400">
                  sysadmin / admin123
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">All Rights & Users</div>
              </button>

              {/* Manager */}
              <button
                type="button"
                onClick={() => handleQuickFill('manager1', 'manager123')}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">Manager</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    manager
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-slate-400">
                  manager1 / manager123
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Approvals & Dashboard</div>
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => handleQuickFill('staff1', 'staff123')}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">Staff</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    staff
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-slate-400">
                  staff1 / staff123
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Payments & KYC</div>
              </button>

            </div>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Role-Based Access Control • SMV Enterprise Secure System</span>
        </div>

      </div>
    </div>
  );
};
