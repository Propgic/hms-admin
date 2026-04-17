import { clsx } from 'clsx';

const colorMap = {
  success: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  gray: 'bg-gray-100 text-gray-700 dark:bg-slate-700/60 dark:text-slate-200',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}
