import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker.css';
import { useTheme } from '../../hooks/useTheme';

// Themed wrapper around react-datepicker. Matches the visual rhythm of
// Input/Select: same height, label + error layout, shared dark/light tokens.
// Pass-through props go straight to ReactDatePicker (e.g. showTimeSelect,
// minDate, maxDate, dateFormat).
const DatePicker = forwardRef(function DatePicker(
  {
    label,
    error,
    value,
    onChange,
    onBlur,
    name,
    placeholder = 'Select date',
    showTimeSelect = false,
    dateFormat,
    minDate,
    maxDate,
    isClearable = true,
    disabled = false,
    className = '',
    ...props
  },
  ref,
) {
  const { isDark } = useTheme();
  const fmt = dateFormat || (showTimeSelect ? 'dd MMM yyyy, h:mm aa' : 'dd MMM yyyy');

  // Accept ISO strings, Date objects, or empty values from the parent form.
  const selected = value ? (value instanceof Date ? value : new Date(value)) : null;
  const validDate = selected && !Number.isNaN(selected.getTime()) ? selected : null;

  const emit = (date) => {
    if (!onChange) return;
    if (!date) return onChange('');
    if (showTimeSelect) return onChange(date.toISOString());
    // Date-only: emit YYYY-MM-DD (compatible with the existing native-input contract).
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      )}
      <div className={clsx('relative', isDark && 'hms-dp-dark')}>
        <ReactDatePicker
          ref={ref}
          selected={validDate}
          onChange={emit}
          onBlur={onBlur}
          name={name}
          placeholderText={placeholder}
          showTimeSelect={showTimeSelect}
          dateFormat={fmt}
          minDate={minDate}
          maxDate={maxDate}
          isClearable={isClearable && !disabled}
          disabled={disabled}
          autoComplete="off"
          popperPlacement="bottom-start"
          className={clsx(
            'w-full pl-9 pr-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-slate-700',
            disabled && 'opacity-60 cursor-not-allowed',
            className,
          )}
          calendarClassName="hms-datepicker"
          wrapperClassName="block w-full"
          {...props}
        />
        <Calendar className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default DatePicker;
