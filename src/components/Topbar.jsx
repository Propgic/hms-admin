import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Sun,
  Moon,
  Building2,
  CreditCard,
  PowerOff,
  Inbox,
  Search,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "../api/axios";
import endpoints from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { getPageTitle } from "../utils/pageTitles";

dayjs.extend(relativeTime);

const NOTIF_LAST_SEEN_KEY = "hms_admin_notif_last_seen";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatToday() {
  const now = new Date();
  return {
    day: dayNames[now.getDay()],
    date: `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
  };
}

function formatLiveTime(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

// Cross-fades date ↔ time every 5s, mirroring hms-care. Width transitions
// in sync between date-size and time-size so the gap to the next icon stays
// tight when the shorter time string is showing.
function LiveDateTime() {
  const [phase, setPhase] = useState("date");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    const swap = setInterval(
      () => setPhase((p) => (p === "date" ? "time" : "date")),
      5000
    );
    return () => clearInterval(swap);
  }, []);
  const dateText = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const timeText = formatLiveTime(now);
  return (
    <span
      className="relative inline-block tabular-nums h-[1.25rem] align-middle"
      style={{ width: "7rem" }}
    >
      <span
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${phase === "date" ? "opacity-100" : "opacity-0"}`}
      >
        {dateText}
      </span>
      <span
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${phase === "time" ? "opacity-100" : "opacity-0"}`}
      >
        {timeText}
      </span>
    </span>
  );
}

const NOTIF_ICON = {
  hospital_created: Building2,
  subscription_created: CreditCard,
  hospital_deactivated: PowerOff,
};

const NOTIF_TONE = {
  hospital_created:
    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  subscription_created:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  hospital_deactivated:
    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
};

export default function Topbar({ leftOffset = 248, gutter = 12 }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState(
    () => Number(localStorage.getItem(NOTIF_LAST_SEEN_KEY)) || 0
  );
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const today = formatToday();
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadNotifs = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get(endpoints.notifications.list, {
        params: { limit: 15 },
      });
      const data = res.data?.data || res.data || [];
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      setNotifs([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Load once on mount so the unread badge is accurate.
  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  // Refresh when opening the panel, and mark everything as seen.
  const handleNotifToggle = () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);
    if (willOpen) {
      loadNotifs();
      const now = Date.now();
      localStorage.setItem(NOTIF_LAST_SEEN_KEY, String(now));
      setLastSeen(now);
    }
  };

  const unreadCount = notifs.reduce(
    (n, item) => (new Date(item.createdAt).getTime() > lastSeen ? n + 1 : n),
    0
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const ThemeIcon = isDark ? Moon : Sun;

  return (
    <header
      className="fixed h-16 flex items-center px-5 gap-2 z-40 transition-[left] duration-200 border rounded-2xl"
      style={{
        left: leftOffset,
        top: gutter,
        right: gutter,
        // Solid background — no backdrop-blur — so scrolled content can't
        // bleed through the header.
        backgroundColor: "var(--topbar-bg)",
        borderColor: "var(--topbar-border)",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px -6px rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex items-center gap-3 mr-auto min-w-0">
        <h1 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
          {pageTitle}
        </h1>
        {/* Live system pulse — small green dot reassures the operator that
            the platform is online. Updates implicitly via the LiveDateTime
            tick already running below. */}
        <span
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/30 rounded-full px-2 py-0.5"
          title="All systems operational"
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
          </span>
          Online
        </span>
      </div>

      <div className="hidden sm:flex items-center text-[13px] text-slate-500 dark:text-slate-400 mr-1">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {today.day}
        </span>
        <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
        <LiveDateTime />
      </div>

      {/* Reusable icon-button shape — subtle base bg, refined hover with
          ring, smooth icon swap on theme toggle. */}
      {/* ⌘K hint button — kicks off the global Command Palette via the
          same keyboard shortcut. Hidden on small screens. */}
      <button
        onClick={() => {
          // Synthesize the same keyboard event the layout listens to.
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        }}
        title="Open command palette (⌘K)"
        className="hidden md:inline-flex items-center gap-2 h-9 px-2.5 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700/60 hover:ring-slate-300 dark:hover:ring-slate-600 rounded-lg transition-all"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search</span>
        <kbd className="inline-flex items-center px-1 py-0.5 text-[10px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500">⌘K</kbd>
      </button>

      <button
        onClick={toggleTheme}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className="relative w-9 h-9 grid place-items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700/60 hover:ring-slate-300 dark:hover:ring-slate-600 rounded-lg transition-all"
      >
        <ThemeIcon
          key={theme}
          className="w-[17px] h-[17px] transition-transform duration-300 [animation:topbar-icon-spin_300ms_ease-out]"
          strokeWidth={1.9}
        />
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={handleNotifToggle}
          className="relative w-9 h-9 grid place-items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700/60 hover:ring-slate-300 dark:hover:ring-slate-600 rounded-lg transition-all"
          title="Notifications"
        >
          <Bell
            className={`w-[17px] h-[17px] ${unreadCount > 0 ? "[animation:topbar-bell-shake_2s_ease-in-out_infinite]" : ""}`}
            strokeWidth={1.9}
          />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[9.5px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
              <span className="absolute top-1 right-1 w-[16px] h-[16px] rounded-full bg-rose-500 opacity-75 animate-ping" />
            </>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 max-h-[460px] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {notifs.length} recent
              </span>
            </div>
            <div className="overflow-y-auto flex-1">
              {notifLoading ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  Loading…
                </div>
              ) : notifs.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Inbox className="w-6 h-6" />
                  <p className="text-sm">You're all caught up</p>
                </div>
              ) : (
                notifs.map((item) => {
                  const Icon = NOTIF_ICON[item.type] || Bell;
                  const tone =
                    NOTIF_TONE[item.type] ||
                    "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800";
                  const isUnread =
                    new Date(item.createdAt).getTime() > lastSeen;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setNotifOpen(false);
                        if (item.link) navigate(item.link);
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-50 dark:border-slate-800 last:border-b-0"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {item.title}
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          )}
                        </p>
                        {item.message && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {item.message}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {dayjs(item.createdAt).fromNow()}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={() => {
                setNotifOpen(false);
                navigate("/activity-logs");
              }}
              className="block w-full px-4 py-2.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 rounded-b-xl"
            >
              View all activity
            </button>
          </div>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-transparent hover:ring-slate-200/70 dark:hover:ring-slate-700/60 rounded-xl pl-2 pr-1.5 py-1 transition-all"
        >
          <div className="hidden md:block text-right leading-tight">
            <p className="text-[13px] text-slate-800 dark:text-slate-100 font-semibold truncate max-w-[140px]">
              {user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.role === "super_admin" ? "Super admin" : (user?.role || "Operator")}
            </p>
          </div>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-blue-500/20">
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate("/settings");
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <User className="w-4 h-4 text-slate-400" />
              Profile
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate("/settings");
              }}
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
