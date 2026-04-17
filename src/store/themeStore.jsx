import { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeContext } from './themeContext';

const STORAGE_KEY = 'hms_admin_theme';
const VALID = ['light', 'dark', 'system'];

function readStored() {
  const v = localStorage.getItem(STORAGE_KEY);
  return VALID.includes(v) ? v : 'system';
}

function systemPref() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored);
  const [systemTheme, setSystemTheme] = useState(systemPref);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [resolvedTheme]);

  const setTheme = useCallback((next) => {
    if (!VALID.includes(next)) return;
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, isDark: resolvedTheme === 'dark' }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
