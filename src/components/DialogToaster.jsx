import { createPortal } from 'react-dom';
import toast, { Toaster, resolveValue, useToasterStore } from 'react-hot-toast';
import { CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// See hms/src/components/DialogToaster.jsx for the full rationale — short
// version: the visible popup is rendered by hand via a portal (the same
// fixed inset-0 + flex centering pattern used elsewhere for modals), not
// through react-hot-toast's own positioning, which assumes a full-width
// container and collapses when pointed at the viewport center instead.
// <Toaster> stays mounted with its container hidden purely to keep its
// duration/dismiss timers running; useToasterStore reads that same state.
const TONE = {
  success: { Icon: CheckCircle2, ring: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', button: 'bg-emerald-600 hover:bg-emerald-700' },
  error: { Icon: XCircle, ring: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', button: 'bg-rose-600 hover:bg-rose-700' },
  loading: { Icon: Loader2, ring: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300', button: 'bg-blue-600 hover:bg-blue-700' },
  blank: { Icon: Info, ring: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300', button: 'bg-blue-600 hover:bg-blue-700' },
};

function DialogToast({ t }) {
  const { Icon, ring, button } = TONE[t.type] || TONE.blank;
  return (
    <div
      role={t.ariaProps.role}
      aria-live={t.ariaProps['aria-live']}
      className="w-full max-w-sm flex flex-col items-center gap-3 rounded-xl border border-transparent bg-white p-5 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <span className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', ring)}>
        <Icon className={clsx('h-6 w-6', t.type === 'loading' && 'animate-spin')} />
      </span>
      <p className="whitespace-pre-line text-sm text-gray-700 dark:text-slate-200">{resolveValue(t.message, t)}</p>
      {t.type !== 'loading' && (
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className={clsx('mt-1 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors', button)}
        >
          OK
        </button>
      )}
    </div>
  );
}

export default function DialogToaster() {
  const { toasts } = useToasterStore();
  const visible = toasts.filter((t) => t.visible);

  return (
    <>
      <Toaster
        containerStyle={{ display: 'none' }}
        toastOptions={{ duration: 3000, error: { duration: 6000 }, loading: { duration: Infinity } }}
      />

      {visible.length > 0 && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/50 p-4">
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {visible.map((t) => <DialogToast key={t.id} t={t} />)}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
