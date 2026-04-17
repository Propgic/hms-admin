import { Sidebar as ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CreditCard, Receipt, HelpCircle, ScrollText,
  BarChart3, Settings, ChevronsLeft, ChevronsRight, LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Hospitals', path: '/hospitals', icon: Building2 },
  { label: 'Plans', path: '/plans', icon: CreditCard },
  { label: 'Billing', path: '/billing', icon: Receipt },
  { label: 'FAQs', path: '/faqs', icon: HelpCircle },
  { label: 'Activity Logs', path: '/activity-logs', icon: ScrollText },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ProSidebar
      collapsed={collapsed}
      width="264px"
      collapsedWidth="80px"
      backgroundColor="#ffffff"
      rootStyles={{
        borderRight: '1px solid #e2e8f0',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        color: '#475569',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className={`h-[72px] flex items-center ${collapsed ? 'justify-center' : 'justify-between px-5'} border-b border-slate-100`}>
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-sm shrink-0">H</div>
              <div className="min-w-0">
                <p className="text-slate-900 font-semibold text-[15px] leading-tight truncate">HMS Admin</p>
                <p className="text-[11px] text-slate-400 tracking-wider uppercase truncate mt-0.5">Platform</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-sm">H</div>
          )}
          <button
            onClick={onToggle}
            className={`${collapsed ? 'absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 shadow-sm' : ''} text-slate-400 hover:text-slate-700 transition`}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4">
          {!collapsed && (
            <p className="px-5 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Main</p>
          )}
          <Menu
            menuItemStyles={{
              button: ({ active }) => ({
                height: '44px',
                margin: '2px 12px',
                borderRadius: '10px',
                paddingLeft: '14px',
                paddingRight: '14px',
                color: active ? '#ffffff' : '#475569',
                backgroundColor: active ? '#0f172a' : 'transparent',
                fontSize: '13.5px',
                fontWeight: active ? 600 : 500,
                letterSpacing: '-0.005em',
                transition: 'background-color .15s, color .15s',
                '&:hover': {
                  backgroundColor: active ? '#0f172a' : '#f1f5f9',
                  color: active ? '#ffffff' : '#0f172a',
                },
              }),
              icon: ({ active }) => ({
                color: active ? '#ffffff' : '#64748b',
                marginRight: collapsed ? 0 : '12px',
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

        {/* User footer */}
        <div className={`border-t border-slate-100 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold shadow-sm"
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </button>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-900 font-semibold truncate leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate capitalize mt-0.5">{user?.role?.replace('_', ' ') || 'super admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </ProSidebar>
  );
}
