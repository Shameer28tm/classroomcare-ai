import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Bot,
  BookOpen,
  Wrench,
  Building2,
  Clock,
  BarChart3,
  Bell,
  ShieldAlert,
  UserCheck,
  HelpCircle,
  X
} from 'lucide-react';
import { getActiveRole, setActiveRole } from '../../lib/api';
import { UserRole } from '../../types';
import { NIU_CONFIG } from '../../config/institution';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Maintenance Requests', path: '/tickets', icon: ClipboardList },
  { name: 'AI Agent Telemetry', path: '/agent', icon: Bot },
  { name: 'Knowledge & Manuals', path: '/knowledge', icon: BookOpen },
  { name: 'Technician Hub', path: '/technician', icon: Wrench },
  { name: 'Facilities & Assets', path: '/facilities', icon: Building2 },
  { name: 'SLA Monitoring', path: '/sla', icon: Clock },
  { name: 'Analytics & Trends', path: '/analytics', icon: BarChart3 },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Administration & Audit', path: '/admin', icon: ShieldAlert },
  { name: 'Help & User Guide', path: '/guide', icon: HelpCircle },
];

const rolesList: { role: UserRole; label: string }[] = [
  { role: 'facilities_manager', label: 'Facilities Manager (Abishek - Demo)' },
  { role: 'technician', label: 'Technician (Demo)' },
  { role: 'safety_officer', label: 'Safety Officer (Demo)' },
  { role: 'student_faculty', label: 'Reporter / Faculty (Demo)' },
  { role: 'campus_admin', label: 'Campus Administrator (Demo)' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(getActiveRole());

  useEffect(() => {
    const handleRoleChange = () => setCurrentRole(getActiveRole());
    window.addEventListener('auth_role_changed', handleRoleChange);
    return () => window.removeEventListener('auth_role_changed', handleRoleChange);
  }, []);

  const handleSelectRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    setCurrentRole(newRole);
  };

  const sidebarContent = (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-xs select-none">
      {/* Brand Header with macOS Traffic Dots */}
      <div>
        <div className="h-16 px-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            {/* macOS Window Controls */}
            <div className="flex items-center gap-1.5 pr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            </div>

            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              NIU
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight text-slate-900 flex items-center gap-1">
                ClassroomCare
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="System Operational"></span>
              </div>
              <div className="text-[9px] text-blue-700 font-semibold tracking-wider uppercase">
                Campus Operations
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              aria-label="Close menu drawer"
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-210px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher Widget (Isolated Sandbox Demo Selector) */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/70">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          Demo Role Sandbox
        </div>
        <p className="text-[9px] text-slate-500 mb-1.5 leading-tight">
          Client sandbox testing only. Production auth via Supabase JWT & RLS.
        </p>
        <select
          value={currentRole}
          onChange={(e) => handleSelectRole(e.target.value as UserRole)}
          aria-label="Active demo role simulation"
          className="w-full bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-2 py-1.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
        >
          {rolesList.map((r) => (
            <option key={r.role} value={r.role}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="text-[9px] text-slate-500 mt-1.5 flex items-center justify-between">
          <span>Campus:</span>
          <span className="text-slate-800 font-mono font-semibold">{NIU_CONFIG.campusCode}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer with Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 flex flex-col w-64 bg-white shadow-xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
