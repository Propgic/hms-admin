import { forwardRef } from 'react';
import ReactSelect from 'react-select';
import { clsx } from 'clsx';
import { useTheme } from '../../hooks/useTheme';

const LIGHT = {
  bg: '#ffffff',
  menuBg: '#ffffff',
  menuBorder: '#e5e7eb',
  text: '#111827',
  muted: '#9ca3af',
  hover: '#f3f4f6',
  selected: '#eff6ff',
  border: '#d1d5db',
  borderFocus: '#3b82f6',
  shadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
};

const DARK = {
  bg: '#111827',         // matches Input dark fill (gray-900 via global shim)
  menuBg: '#1e293b',     // slate-800 — menu stands one step above the field
  menuBorder: '#334155', // slate-700
  text: '#f1f5f9',       // slate-100
  muted: '#64748b',      // slate-500
  hover: '#334155',
  selected: '#1e3a8a',   // blue-900
  border: '#334155',
  borderFocus: '#3b82f6',
  shadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
};

const buildStyles = (hasError, c) => ({
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    backgroundColor: c.bg,
    borderColor: hasError ? '#fca5a5' : state.isFocused ? c.borderFocus : c.border,
    boxShadow: state.isFocused
      ? `0 0 0 2px ${hasError ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`
      : 'none',
    '&:hover': { borderColor: hasError ? '#fca5a5' : c.borderFocus },
    borderRadius: '8px',
    fontSize: '14px',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: c.menuBg,
    border: `1px solid ${c.menuBorder}`,
    boxShadow: c.shadow,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menuList: (base) => ({ ...base, backgroundColor: c.menuBg, padding: 4 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? c.selected : state.isFocused ? c.hover : c.menuBg,
    color: c.text,
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '6px',
    padding: '8px 12px',
  }),
  singleValue: (base) => ({ ...base, color: c.text }),
  placeholder: (base) => ({ ...base, color: c.muted }),
  input: (base) => ({ ...base, color: c.text }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: c.muted, padding: '6px' }),
});

const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    placeholder = 'Select...',
    value,
    onChange,
    onBlur,
    name,
    isClearable = false,
    isDisabled = false,
    className = '',
    ...props
  },
  ref
) {
  const { isDark } = useTheme();
  const palette = isDark ? DARK : LIGHT;
  const selected = options.find((o) => String(o.value) === String(value ?? '')) || null;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      )}
      <ReactSelect
        ref={ref}
        name={name}
        value={selected}
        onChange={(opt) => onChange?.(opt ? opt.value : '')}
        onBlur={onBlur}
        options={options}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        styles={buildStyles(!!error, palette)}
        className={clsx('react-select-container', className)}
        classNamePrefix="react-select"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
