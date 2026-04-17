import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('hms_admin_sidebar_collapsed') === '1';
  });

  useEffect(() => {
    localStorage.setItem('hms_admin_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const sidebarWidth = collapsed ? 80 : 248;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Topbar leftOffset={sidebarWidth} />
      <main
        className="pt-16 p-6 transition-[margin] duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <Outlet />
      </main>
    </div>
  );
}
