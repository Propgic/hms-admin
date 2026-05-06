import { Outlet } from 'react-router-dom';
import { ShieldCheck, Activity, Building2, Sparkles, Users, TrendingUp } from 'lucide-react';
import DoctorMascot from '../components/auth/DoctorMascot';

// Reusable floating-orb decorations. Pure CSS animation via index.css
// keyframes — no JS-driven raf loop, so they don't fight React's renders.
function Orb({ className, delay = 0 }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-60 mix-blend-screen pointer-events-none ${className}`}
      style={{ animation: `auth-float 14s ease-in-out infinite`, animationDelay: `${delay}s` }}
    />
  );
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0b0d1a] text-white flex">
      {/* animated mesh-gradient background — blue/indigo to match the
          dashboard sidebar (from-blue-600 to-indigo-700). */}
      <div className="absolute inset-0 -z-10">
        <Orb className="w-[520px] h-[520px] bg-blue-600 -top-40 -left-32" />
        <Orb className="w-[420px] h-[420px] bg-indigo-700 top-1/3 -right-32" delay={3} />
        <Orb className="w-[480px] h-[480px] bg-sky-500 bottom-[-180px] left-1/3" delay={6} />
        <Orb className="w-[360px] h-[360px] bg-indigo-500 top-1/4 left-1/2" delay={9} />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        {/* radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(11,13,26,0.85) 100%)',
          }}
        />
      </div>

      {/* Left: brand + mascot panel */}
      <div className="hidden lg:flex lg:w-1/2 relative px-12 py-10 flex-col justify-between">
        {/* brand bar — match sidebar logo (blue-600 → indigo-700) */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 font-bold text-white">
            H
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">
              <span className="text-blue-300">hms</span>
              <span className="text-white">·admin</span>
            </p>
            <p className="text-[11px] text-blue-200/80">Operator console</p>
          </div>
        </div>

        {/* mascot + headline */}
        <div className="flex items-end gap-8 -mt-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-indigo-600/30 rounded-full blur-3xl" />
            <div className="relative">
              <DoctorMascot size={320} />
            </div>
            {/* speech bubble */}
            <div className="absolute -top-4 left-72 bg-white text-slate-900 rounded-2xl rounded-bl-none px-4 py-2 shadow-xl text-sm font-medium auth-bubble">
              Welcome, operator 👋
              <span className="absolute -bottom-2 left-2 w-3 h-3 bg-white rotate-45" />
            </div>
          </div>
          <div className="pb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1 text-[11px] font-medium">
              <Sparkles className="w-3 h-3" /> Operator console
            </span>
            <h2 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight">
              Every hospital, <br />
              <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                one console.
              </span>
            </h2>
            <p className="mt-3 text-sm text-blue-100/80 max-w-sm">
              Provision tenants, manage subscriptions, monitor compliance and revenue — everything you need to run the HMS network in one place.
            </p>
          </div>
        </div>

        {/* stats + compliance */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            {[
              { icon: Building2, label: 'Hospitals',    value: '142',     accent: 'text-blue-200',  trend: null },
              { icon: Users,     label: 'Active users', value: '2,845',   accent: 'text-indigo-200', trend: null },
              { icon: TrendingUp,label: 'Growth',       value: '+12.2%',  accent: 'text-emerald-200', trend: 'up' },
              { icon: Activity,  label: 'Uptime',       value: '99.98%',  accent: 'text-sky-200',    trend: null },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-3.5 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <s.icon className={`w-4 h-4 ${s.accent}`} />
                  {s.trend === 'up' && (
                    <span className="text-[10px] font-medium text-emerald-300/90">↑ trending</span>
                  )}
                </div>
                <p className="mt-2 text-xl font-semibold tracking-tight">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-blue-200/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-blue-100/70">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <p>HIPAA · DPDP Act 2023 · ABDM compliant · End-to-end encrypted</p>
          </div>
        </div>
      </div>

      {/* Right: glass form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        {/* mobile brand bar */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white">
            H
          </div>
          <div>
            <p className="font-bold text-sm">
              <span className="text-blue-300">hms</span>
              <span className="text-white">·admin</span>
            </p>
            <p className="text-[10px] text-blue-200">Operator console</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 p-8 auth-card">
            <Outlet />
          </div>
          <p className="mt-6 text-center text-[11px] text-blue-200/50">
            © {new Date().getFullYear()} hms·admin · Operator Console · Secured by TLS 1.3
          </p>
        </div>
      </div>
    </div>
  );
}
