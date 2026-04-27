import { Sidebar as ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CreditCard, Receipt, HelpCircle, ScrollText,
  BarChart3, Settings, ChevronsLeft, ChevronsRight, Ticket, FileText, Megaphone, LifeBuoy,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Hospitals', path: '/hospitals', icon: Building2 },
  { label: 'Plans', path: '/plans', icon: CreditCard },
  { label: 'Billing', path: '/billing', icon: Receipt },
  { label: 'Invoices', path: '/invoices', icon: FileText },
  { label: 'Coupons', path: '/coupons', icon: Ticket },
  { label: 'Announcements', path: '/announcements', icon: Megaphone },
  { label: 'Support', path: '/support', icon: LifeBuoy },
  { label: 'FAQs', path: '/faqs', icon: HelpCircle },
  { label: 'Activity Logs', path: '/activity-logs', icon: ScrollText },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, gutter = 12 }) {
  const location = useLocation();
  const { isDark } = useTheme();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const palette = isDark
    ? {
        bg: '#0b1220',
        border: '#1f2937',
        item: '#94a3b8',
        itemIcon: '#64748b',
        activeBg: 'rgba(59, 130, 246, 0.15)',
        activeText: '#60a5fa',
        hoverBg: 'rgba(255, 255, 255, 0.04)',
        hoverText: '#f1f5f9',
      }
    : {
        bg: '#ffffff',
        border: '#eef2f6',
        item: '#475569',
        itemIcon: '#94a3b8',
        activeBg: '#eff6ff',
        activeText: '#2563eb',
        hoverBg: '#f8fafc',
        hoverText: '#0f172a',
      };

  return (
    <ProSidebar
      collapsed={collapsed}
      width="248px"
      collapsedWidth="80px"
      backgroundColor={palette.bg}
      rootStyles={{
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        height: `calc(100vh - ${gutter * 2}px)`,
        position: 'fixed',
        left: gutter,
        top: gutter,
        color: palette.item,
        overflow: 'hidden',
      }}
    >
      <div className="flex flex-col h-full relative">
        {/* Brand */}
        <div className={`pt-8 pb-6 flex items-center ${collapsed ? 'justify-center' : 'justify-center px-5'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-[15px] shadow-sm">H</div>
            {!collapsed && (
              <span className="text-[20px] font-bold tracking-tight">
                <span className="text-blue-600 dark:text-blue-400">hms</span>
                <span className="text-slate-800 dark:text-slate-100">·admin</span>
              </span>
            )}
          </div>
        </div>
        <div className="mx-5 border-t border-slate-100 dark:border-slate-800" />

        {/* Menu */}
        <div className="flex-1 min-h-0 overflow-y-auto pt-4 pb-4">
          <Menu
            menuItemStyles={{
              button: ({ active }) => ({
                height: '44px',
                margin: collapsed ? '3px 10px' : '3px 12px',
                borderRadius: '10px',
                paddingLeft: collapsed ? 0 : '14px',
                paddingRight: collapsed ? 0 : '14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? palette.activeText : palette.item,
                backgroundColor: active ? palette.activeBg : 'transparent',
                fontSize: '14px',
                fontWeight: active ? 600 : 500,
                letterSpacing: '-0.005em',
                transition: 'background-color .15s, color .15s',
                '&:hover': {
                  backgroundColor: active ? palette.activeBg : palette.hoverBg,
                  color: active ? palette.activeText : palette.hoverText,
                },
              }),
              icon: ({ active }) => ({
                color: active ? palette.activeText : palette.itemIcon,
                marginRight: collapsed ? 0 : '12px',
                marginLeft: 0,
              }),
              label: () => ({
                display: collapsed ? 'none' : 'block',
                opacity: collapsed ? 0 : 1,
              }),
            }}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.path}
                active={isActive(item.path)}
                icon={<item.icon className="w-[18px] h-[18px]" strokeWidth={2} />}
                component={<NavLink to={item.path} end={item.path === '/'} />}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </div>

        {/* Collapse toggle at bottom */}
        <div className="shrink-0 flex justify-center py-4" style={{ backgroundColor: palette.bg }}>
          <button
            onClick={onToggle}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </ProSidebar>
  );
}
