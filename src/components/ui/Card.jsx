import { clsx } from 'clsx';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={clsx('bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 p-3 shadow-sm rounded-lg', className)}
      {...props}
    >
      {children}
    </div>
  );
}
