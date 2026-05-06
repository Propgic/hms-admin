import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 backdrop-blur border border-blue-400/30 px-2.5 py-1 text-[11px] font-medium text-blue-200">
          <Sparkles className="w-3 h-3" /> Operator console
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-blue-100/60">
          Sign in to manage hospitals, plans and platform health.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-[11px] font-semibold text-blue-200/70 uppercase tracking-[0.12em]">
            Professional email
          </label>
          <div className="mt-1.5 group relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50 group-focus-within:text-blue-300 transition-colors" />
            <input
              type="email"
              placeholder="name@hospital.com"
              autoComplete="email"
              className="w-full pl-10 pr-3 py-3 text-sm bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-blue-200/30 focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/15 transition"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-blue-200/70 uppercase tracking-[0.12em]">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-medium text-blue-300 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="mt-1.5 group relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50 group-focus-within:text-blue-300 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 text-sm bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-blue-200/30 focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/15 transition"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-blue-200"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-blue-100/80 select-none cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-400 focus:ring-offset-0"
          />
          Keep me signed in on this workstation
        </label>

        <button
          type="submit"
          disabled={loading}
          className="auth-cta group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] animate-[auth-shine_3s_linear_infinite]" />
          <span className="relative flex items-center gap-2">
            {loading ? 'Signing in…' : (
              <>
                Sign in to dashboard
                <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </span>
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-[11px] text-blue-200/40">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span>secured · encrypted · audited</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}
