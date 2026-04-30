import { Outlet } from 'react-router-dom';
import { ShieldCheck, Activity, Users, Building2, TrendingUp } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 40%)',
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <span className="font-bold text-lg">H</span>
              </div>
              <div>
                <p className="font-semibold tracking-wide">HMS PLATFORM</p>
                <p className="text-xs text-blue-200">Clinical curator</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                Orchestrate your entire<br />hospital network.
              </h2>
              <p className="mt-4 text-blue-100 max-w-md">
                A unified command center for hospitals, subscriptions, compliance and analytics — built for healthcare operators.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              {[
                { icon: Building2, label: 'Hospitals', value: '142' },
                { icon: Users, label: 'Active users', value: '2,845' },
                { icon: Activity, label: 'Uptime', value: '99.98%' },
                { icon: TrendingUp, label: 'Growth', value: '+12.2%' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4">
                  <s.icon className="w-4 h-4 text-blue-200" />
                  <p className="mt-3 text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-blue-100">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <p className="font-medium text-white">HIPAA compliant environment</p>
              <p>All sessions are end-to-end encrypted.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">H</div>
            <div>
              <p className="font-semibold text-slate-900">HMS Admin</p>
              <p className="text-xs text-slate-500">Hospital Management Platform</p>
            </div>
          </div>
          <Outlet />
          <p className="mt-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} HMS Platform · Secured by TLS 1.3
          </p>
        </div>
      </div>
    </div>
  );
}
