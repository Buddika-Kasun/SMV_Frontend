import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { userService } from "../../services/user.service";
import toast from "react-hot-toast";
import { User } from "../../api";
import {
  Building2,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

import logoIcon from "@/src/assets/logo2.jpg";
import { BRAND } from "@/src/config/brand";

interface LoginScreenProps {
  onLoginSuccess?: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await userService.login(username, password);

      if (result.success && result.user) {
        toast.success(`Login Successful!`, {
          duration: 3000,
        });

        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }

        // Route by role: staff land on applications, others on dashboard
        const target =
          result.user.role === "staff" ? "/applications" : "/dashboard";

        setTimeout(() => {
          window.location.href = `${target}?from=login_success`;
        }, 1000);
      } else {
        setError(result.error || "Login failed");
        toast.error(result.error || "Login failed");
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center rounded-full shadow-lg shadow-blue-500/30 text-white mx-auto">
            <img
              src={logoIcon}
              alt={BRAND.name}
              className="w-14 h-14 object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {BRAND.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {BRAND.tagline} Management Enterprise Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Staff & Management Sign In
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter credentials to access authorized modules
              </p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition font-mono text-xs"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition text-xs [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={loading}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-2xs mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Role-Based Access Control • {BRAND.shortName} Secure System</span>
        </div>
      </div>
    </div>
  );
};
