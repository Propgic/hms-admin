import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const options = [
  { value: 'light', label: 'Light', Icon: Sun, desc: 'Bright surfaces, ideal for daytime.' },
  { value: 'dark', label: 'Dark', Icon: Moon, desc: 'Gentle on the eyes in low-light.' },
  { value: 'system', label: 'System', Icon: Monitor, desc: 'Follow your OS preference.' },
];

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-5" style={{ borderColor: 'var(--border-strong)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
          <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pick how the dashboard looks to you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map(({ value, label, Icon, desc }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`text-left p-4 rounded-xl border-2 transition ${
                active
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 dark:border-blue-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  active
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm font-semibold ${
                  active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'
                }`}>{label}</span>
                {active && (
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">Active</span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
