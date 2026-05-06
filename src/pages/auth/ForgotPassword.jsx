import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post(endpoints.auth.forgotPassword, data);
      setSentTo(data.email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4 auth-bubble">
          <CheckCircle2 className="w-7 h-7 text-emerald-300" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          Check your inbox
        </h2>
        <p className="mt-2 text-sm text-blue-100/70">
          We sent a password reset link to
        </p>
        <p className="mt-0.5 text-sm font-medium text-blue-200 break-all">{sentTo}</p>
        <p className="mt-4 text-xs text-blue-200/50">
          The link expires in 30 minutes. Didn't get it? Check spam, or try again in a moment.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 backdrop-blur border border-blue-400/30 px-2.5 py-1 text-[11px] font-medium text-blue-200">
          <Sparkles className="w-3 h-3" /> Account recovery
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          Forgot password?
        </h1>
        <p className="mt-1.5 text-sm text-blue-100/60">
          Enter your email and we'll send a one-time reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              autoFocus
              className="w-full pl-10 pr-3 py-3 text-sm bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-blue-200/30 focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/15 transition"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-cta group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] animate-[auth-shine_3s_linear_infinite]" />
          <span className="relative flex items-center gap-2">
            {loading ? 'Sending…' : (
              <>
                Send reset link
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
