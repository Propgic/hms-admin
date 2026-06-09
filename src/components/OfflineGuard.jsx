import { useEffect, useState } from 'react';
import { Activity, Clock, Command, RefreshCw, Server, ShieldCheck, WifiOff } from 'lucide-react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

const statusCards = [
  { label: 'Session kept', value: 'Console stays ready', icon: ShieldCheck },
  { label: 'Admin state held', value: 'Filters and page kept', icon: Command },
  { label: 'Auto resume', value: 'Back when online', icon: RefreshCw },
];

const signalBars = [46, 72, 36, 88, 58, 28, 66];

function OfflinePage() {
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    setChecking(true);
    window.setTimeout(() => setChecking(false), 700);
  };

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <section className="w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <aside className="relative min-h-[420px] overflow-hidden bg-[#050b1d] p-6 text-white sm:p-8 lg:p-10">
              <div className="absolute inset-x-0 top-0 h-1 bg-blue-600" />
              <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#ffffff_1px,transparent_1px),linear-gradient(0deg,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

              <div className="relative flex h-full flex-col justify-between gap-10">
                <div>
                  <div className="inline-flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-950/30">
                      <Command className="h-7 w-7" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">
                      <span className="text-blue-300">Hos</span>
                      <span className="text-white">gic</span>
                    </span>
                  </div>

                  <div className="mt-12 max-w-md">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-1.5 text-sm font-medium text-blue-50">
                      <WifiOff className="h-4 w-4" />
                      Offline mode
                    </div>
                    <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                      Admin console paused
                    </h1>
                    <p className="mt-5 text-base leading-8 text-slate-300">
                      Platform controls are safely held until your device reconnects to the network.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex h-28 items-end gap-2">
                    {signalBars.map((height, index) => (
                      <span
                        key={height}
                        className="flex-1 rounded-t-lg bg-blue-400"
                        style={{
                          height: `${height}%`,
                          opacity: index === signalBars.length - 2 ? 0.35 : 0.9,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-300" />
                      Platform monitor
                    </span>
                    <span className="rounded-lg bg-blue-400/10 px-2 py-1 text-xs font-semibold text-blue-200">
                      State retained
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  <Server className="h-4 w-4" />
                  Network check
                </div>
                <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
                  Waiting for a stable connection
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                  Hosgic will return to your current workspace as soon as the browser is back online.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {statusCards.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Status: offline</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        Console will unlock automatically
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheck}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/10 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                      Check again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function OfflineGuard({ children }) {
  const isOnline = useOnlineStatus();
  return isOnline ? children : <OfflinePage />;
}
