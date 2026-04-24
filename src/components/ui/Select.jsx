import { forwardRef } from 'react';
import ReactSelect from 'react-select';
import { clsx } from 'clsx';

const buildStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    backgroundColor: '#ffffff',
    borderColor: hasError ? '#fca5a5' : state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused
      ? `0 0 0 2px ${hasError ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`
      : 'none',
    '&:hover': { borderColor: hasError ? '#fca5a5' : '#3b82f6' },
    borderRadius: '8px',
    fontSize: '14px',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    zIndex: 9999,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menuList: (base) => ({ ...base, backgroundColor: '#ffffff', padding: 4 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f3f4f6' : '#ffffff',
    color: '#111827',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '6px',
    padding: '8px 12px',
  }),
  singleValue: (base) => ({ ...base, color: '#111827' }),
  placeholder: (base) => ({ ...base, color: '#9ca3af' }),
  input: (base) => ({ ...base, color: '#111827' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: '#9ca3af', padding: '6px' }),
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
        styles={buildStyles(!!error)}
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
