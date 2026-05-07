import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import RouteTransition from '../components/RouteTransition';

const GUTTER = 12;
const TOPBAR_H = 64;

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('hms_admin_sidebar_collapsed') === '1';
  });
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('hms_admin_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  // Global ⌘K / Ctrl+K toggles the Command Palette anywhere in the app.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sidebarWidth = collapsed ? 80 : 248;
  const contentLeft = sidebarWidth + GUTTER * 2;

  return (
    <div
      className="h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--app-bg)', padding: GUTTER }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        gutter={GUTTER}
      />
      <Topbar leftOffset={contentLeft} gutter={GUTTER} />
      <main
        className="transition-[margin] duration-200 overflow-y-auto"
        style={{
          marginLeft: contentLeft - GUTTER,
          height: `calc(100vh - ${GUTTER * 2}px)`,
          paddingTop: TOPBAR_H + GUTTER * 3,
          paddingLeft: GUTTER,
          paddingRight: 0,
        }}
      >
        <RouteTransition><Outlet /></RouteTransition>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
