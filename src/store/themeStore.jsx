import { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeContext } from './themeContext';

const STORAGE_KEY = 'hms_admin_theme';
const VALID = ['light', 'dark'];

function readStored() {
  const v = localStorage.getItem(STORAGE_KEY);
  // Older builds also persisted 'system' — migrate those installs to light
  // so the user lands on a deterministic theme on next load.
  if (v === 'system') return 'light';
  return VALID.includes(v) ? v : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!VALID.includes(next)) return;
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme: theme, isDark: theme === 'dark' }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
