import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles, Check, X } from 'lucide-react';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Strength heuristic: tally how many checks pass and color the meter.
function scorePassword(pw = '') {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^\w\s]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { passed, total: 5, checks };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const pwValue = watch('password') || '';
  const score = useMemo(() => scorePassword(pwValue), [pwValue]);
  const meterColor = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'][score.passed - 1] || 'bg-slate-700';
  const meterLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][Math.max(0, score.passed - 1)] || 'Enter a password';

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post(endpoints.auth.resetPassword, { token, password: data.password });
      toast.success('Password reset successful');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 backdrop-blur border border-blue-400/30 px-2.5 py-1 text-[11px] font-medium text-blue-200">
          <Sparkles className="w-3 h-3" /> Set a new password
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          Reset password
        </h1>
        <p className="mt-1.5 text-sm text-blue-100/60">
          Pick a strong one — you'll use it to sign in next time.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-blue-200/70 uppercase tracking-[0.12em]">
            New password
          </label>
          <div className="mt-1.5 group relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50 group-focus-within:text-blue-300 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars · upper, lower, number"
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

          {/* Strength meter */}
          <div className="mt-3">
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-colors ${i < score.passed ? meterColor : 'bg-white/10'}`}
                />
              ))}
            </div>
            <div className="mt-2 text-[11px] text-blue-200/70 flex items-center justify-between">
              <span>{meterLabel}</span>
              <span>{score.passed}/5 checks</span>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {[
                ['length', '8+ characters'],
                ['upper', 'Uppercase letter'],
                ['lower', 'Lowercase letter'],
                ['number', 'Number'],
                ['symbol', 'Symbol'],
              ].map(([k, label]) => (
                <li key={k} className={`inline-flex items-center gap-1 ${score.checks[k] ? 'text-emerald-300' : 'text-blue-200/40'}`}>
                  {score.checks[k] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-blue-200/70 uppercase tracking-[0.12em]">
            Confirm new password
          </label>
          <div className="mt-1.5 group relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50 group-focus-within:text-blue-300 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Type it again"
              className="w-full pl-10 pr-3 py-3 text-sm bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-blue-200/30 focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/15 transition"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-rose-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || score.passed < 3}
          className="auth-cta group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] animate-[auth-shine_3s_linear_infinite]" />
          <span className="relative flex items-center gap-2">
            {loading ? 'Resetting…' : (
              <>
                Reset password
                <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </span>
        </button>
      </form>

      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-blue-300/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>
    </div>
  );
}
