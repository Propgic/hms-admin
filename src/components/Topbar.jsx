import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, User, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatToday() {
  const now = new Date();
  return {
    day: dayNames[now.getDay()],
    date: `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
  };
}

export default function Topbar({ leftOffset = 248 }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const today = formatToday();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const ThemeIcon = theme === 'system' ? Monitor : isDark ? Moon : Sun;

  return (
    <header
      className="fixed top-0 right-0 h-16 flex items-center justify-end px-6 gap-4 z-30 transition-[left] duration-200 border-b"
      style={{
        left: leftOffset,
        backgroundColor: 'var(--topbar-bg)',
        borderColor: 'var(--topbar-border)',
      }}
    >
      <div className="hidden sm:flex items-center text-[13px] text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{today.day}</span>
        <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
        <span>{today.date}</span>
      </div>

      <button
        onClick={toggleTheme}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
      >
        <ThemeIcon className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </button>

      <button
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
        title="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
          3
        </span>
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-2 py-1.5 transition"
        >
          <div className="hidden sm:block text-right">
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-tight">My Profile</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email || ''}</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <User className="w-4 h-4 text-slate-400" />
              Profile
            </button>
            <button
              onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Settings
            </button>
            <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
