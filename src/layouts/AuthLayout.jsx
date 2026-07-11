import { Outlet } from 'react-router-dom';
import { ShieldCheck, Activity, Building2, Sparkles, CreditCard, BarChart3 } from 'lucide-react';
import OperatorMascot from '../components/auth/OperatorMascot';
import RouteTransition from './../components/RouteTransition';

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

      {/* Left: brand + mascot panel — single tight column, vertically
          centered. Brand pinned top-left, compliance pinned bottom-left,
          everything else is one cohesive group between them. */}
      <div className="hidden lg:flex lg:w-1/2 relative px-12 py-8 flex-col">
        {/* brand bar — match sidebar logo (blue-600 → indigo-700) */}
        <div className="flex items-center gap-1.5">
          <img src="/trasnparent_bg_hms_logo.png" alt="MedNote" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-base font-bold tracking-tight leading-none">
              <span className="text-blue-300">Med</span>
              <span className="text-white">Note</span>
            </p>
            <p className="text-[11px] text-blue-200/80 mt-0.5">Operator console</p>
          </div>
        </div>

        {/* main content — centered in the remaining vertical space, kept
            cohesive (mascot + copy + stats all in one block, no splits). */}
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-indigo-600/30 rounded-full blur-3xl" />
              <div className="relative">
                <OperatorMascot size={240} />
              </div>
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 px-2.5 py-1 text-[11px] font-medium">
                <Sparkles className="w-3 h-3" /> Operator console
              </span>
              <h2 className="mt-3 text-[32px] font-bold leading-[1.1] tracking-tight">
                Every hospital,<br />
                <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                  one console.
                </span>
              </h2>
              <p className="mt-2.5 text-sm text-blue-100/75 max-w-sm leading-relaxed">
                Provision tenants, manage subscriptions, monitor compliance and revenue — everything you need to run the HMS network in one place.
              </p>
            </div>
          </div>

          {/* Feature highlights — what the operator console delivers.
              Four-up grid mirrors the prior rhythm; replaces vanity stats
              with USPs so the marquee doesn't lie pre-launch. */}
          <div className="grid grid-cols-4 gap-2.5 max-w-2xl">
            {[
              { icon: Building2,  title: 'Multi-tenant',    description: 'Provision unlimited hospitals',  accent: 'text-blue-300' },
              { icon: CreditCard, title: 'Billing built-in', description: 'Plans, coupons, invoices',       accent: 'text-indigo-300' },
              { icon: BarChart3,  title: 'Live insights',    description: 'Revenue, MRR, growth signals',  accent: 'text-emerald-300' },
              { icon: Activity,   title: 'Platform health',  description: 'Uptime, audit logs, compliance', accent: 'text-sky-300' },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-3 hover:bg-white/[0.07] transition-colors"
              >
                <f.icon className={`w-4 h-4 ${f.accent}`} />
                <p className="mt-2 text-[13px] font-semibold tracking-tight leading-snug">{f.title}</p>
                <p className="text-[10px] text-blue-200/60 mt-0.5 leading-snug">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* compliance — bottom rail */}
        <div className="flex items-center gap-3 text-[11px] text-blue-100/70">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <p>HIPAA · DPDP Act 2023 · ABDM compliant · End-to-end encrypted</p>
        </div>
      </div>

      {/* Right: glass form. On mobile we drop the absolute brand bar and
          let it flow above the form card so it never overlaps. On lg+ the
          left brand panel handles identity and this section just centers
          the form. */}
      <div className="flex-1 flex flex-col p-6 sm:p-10 lg:p-12 relative">
        {/* mobile-only brand bar — flows above the card */}
        <div className="lg:hidden flex items-center gap-1.5 mb-6">
          <img src="/trasnparent_bg_hms_logo.png" alt="MedNote" className="w-10 h-10 shrink-0 object-contain" />
          <div>
            <p className="font-bold text-sm leading-none">
              <span className="text-blue-300">Med</span>
              <span className="text-white">Note</span>
            </p>
            <p className="text-[10px] text-blue-200 mt-0.5">Operator console</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 p-8 auth-card">
            <RouteTransition><Outlet /></RouteTransition>
          </div>
          <p className="mt-6 text-center text-[11px] text-blue-200/50">
            © {new Date().getFullYear()} MedNote · Operator Console · Secured by TLS 1.3
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
