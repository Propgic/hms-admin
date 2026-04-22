import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = '', ...props },
  ref
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      )}
      <div className={clsx('relative', className)}>
        <select
          ref={ref}
          className={clsx(
            'w-full appearance-none pl-3 pr-10 py-2 text-sm border rounded-lg bg-white text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            '[color-scheme:light] dark:[color-scheme:dark]',
            'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700',
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400"
          aria-hidden="true"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
