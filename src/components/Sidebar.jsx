import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  HelpCircle,
  ScrollText,
  BarChart3,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';

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

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col" style={{ backgroundColor: '#0F172A' }}>
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">H</span>
        </div>
        <span className="text-white font-semibold text-lg">HMS Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">HMS Platform v1.0</p>
      </div>
    </aside>
  );
}
