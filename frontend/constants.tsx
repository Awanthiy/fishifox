
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  CreditCard, 
  Briefcase, 
  CalendarClock, 
  BellRing, 
  ShieldCheck,
  FileBadge,
  LogOut
} from 'lucide-react';

export const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'customers', label: 'Customers', icon: <Users size={20} />, path: '/customers' },
  { id: 'services', label: 'Services', icon: <Settings size={20} />, path: '/services' },
  { id: 'quotations', label: 'Quotations', icon: <FileBadge size={20} />, path: '/quotations' },
  { id: 'invoices', label: 'Invoices', icon: <FileText size={20} />, path: '/invoices' },
  { id: 'upcoming', label: 'Upcoming Invoices', icon: <CalendarClock size={20} />, path: '/upcoming' },
  { id: 'projects', label: 'Projects', icon: <Briefcase size={20} />, path: '/projects' },
  { id: 'expirations', label: 'Expirations', icon: <BellRing size={20} />, path: '/expirations' },
];
