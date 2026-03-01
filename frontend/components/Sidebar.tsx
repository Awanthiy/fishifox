import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Layers,
  FileText,
  BellRing,
  FileBadge,
  CalendarClock,
  Settings
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const items = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
    { label: 'Customers', icon: <Users size={18} />, path: '/customers' },
    { label: 'Services', icon: <Layers size={18} />, path: '/services' },
    { label: 'Quotations', icon: <FileBadge size={18} />, path: '/quotations' },
    { label: 'Invoices', icon: <FileText size={18} />, path: '/invoices' },
    { label: 'Upcoming', icon: <CalendarClock size={18} />, path: '/upcoming' },
    { label: 'Projects', icon: <Briefcase size={18} />, path: '/projects' },
    { label: 'Expirations', icon: <BellRing size={18} />, path: '/expirations' },
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
  ];

  return (
    <aside
      className="w-64 flex flex-col py-10"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
      }}
    >
      <div className="px-8 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-logo font-black tracking-tight leading-none">
            <span className="text-white">Fishi</span>
            <span style={{ color: 'rgb(var(--secondary))' }}>Fox</span>
          </h1>
          <p className="text-[7px] font-black uppercase tracking-[0.25em] leading-tight whitespace-nowrap opacity-60">
            DIVING TO AN UNEXPECTED DEPTH
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-8 py-4 transition-all duration-300 group
              ${isActive ? 'sidebar-link-active' : 'hover:text-white hover:bg-white/5'}
            `}
          >
            <span className="shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-[13px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-8 pb-4 opacity-30 text-[9px] font-black uppercase tracking-widest">
        Fishifox Systems v2.0
      </div>
    </aside>
  );
};

export default Sidebar;
