import { useEffect, useState } from 'react';
import { Activity, RefreshCw, WifiOff } from 'lucide-react';

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

function OfflinePage() {
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    setChecking(true);
    window.setTimeout(() => setChecking(false), 700);
  };

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--text)] flex items-center justify-center px-5 py-8">
      <section className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[360px] bg-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
            <div>
              <div className="inline-flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-950/30">
                  H
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-blue-300">hms</span>
                  <span className="text-white">.admin</span>
                </span>
              </div>
              <div className="mt-12 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-blue-100">
                  <WifiOff className="w-4 h-4" />
                  Offline mode
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                  Admin console paused
                </h1>
                <p className="max-w-sm text-sm sm:text-base text-slate-300 leading-7">
                  Platform controls will resume when your device reconnects to the network.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 max-w-xs">
              <div className="flex items-end gap-2 h-24">
                {[42, 70, 32, 86, 55, 24, 64].map((height) => (
                  <span key={height} className="flex-1 rounded-t-md bg-blue-400/80" style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                <Activity className="w-4 h-4 text-blue-300" />
                Connectivity monitor
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Network check</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-950 dark:text-slate-100">
                Waiting for a stable connection
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-7">
                Keep this tab open. HMS Admin will return to the current workspace automatically when the browser is online.
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-3">
                {['Session kept', 'Admin state held', 'Auto resume'].map((item) => (
                  <div key={item} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleCheck}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                  Check again
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Status: offline
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function OfflineGuard({ children }) {
  const isOnline = useOnlineStatus();
  return isOnline ? children : <OfflinePage />;
}
