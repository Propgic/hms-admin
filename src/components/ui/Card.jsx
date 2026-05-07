import { clsx } from 'clsx';

// Shared card surface — modern soft shadow + slight tint border. The shadow
// is a two-layer combo: a tight 1px hairline for crispness + a wider, softer
// drop for ambient depth. Looks premium without being heavy.
export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-900 rounded-xl p-3',
        'border border-slate-200/70 dark:border-slate-700/60',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-6px_rgba(15,23,42,0.06)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
