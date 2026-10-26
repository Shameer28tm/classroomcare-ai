import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldCheck,
  PhoneCall,
  User,
  Menu,
  Sun,
  Moon,
  HelpCircle,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getActiveRole } from '../../lib/api';
import { NIU_CONFIG } from '../../config/institution';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const role = getActiveRole();

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('niu_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setIsDark(false);
      document.documentElement.removeAttribute('data-theme');
    }

    api.getNotifications()
      .then((notifs) => {
        setUnreadCount(notifs.filter((n) => !n.read).length);
      })
      .catch(() => {
        setUnreadCount(0);
      });
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('niu_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('niu_theme', 'light');
    }
  };

  const handleStartTour = () => {
    window.dispatchEvent(new CustomEvent('restart_onboarding_tour'));
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu Toggle & System Status */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Safety Lock Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Safety Shield:</span>
          <span className="tracking-wide">DETERMINISTIC LOCK</span>
        </div>

        {/* LangGraph RAG Telemetry indicator */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>RAG Telemetry: Active</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Campus Emergency Hotline */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
          <PhoneCall className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>Switchboard: <strong>{NIU_CONFIG.switchboardPhone}</strong> / <strong>112</strong></span>
        </div>

        {/* Start Tour Button */}
        <button
          onClick={handleStartTour}
          title="Start interactive onboarding orientation"
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 hidden sm:flex items-center gap-1.5 text-xs font-medium"
        >
          <Compass className="w-4 h-4 text-blue-600" />
          <span className="hidden md:inline">Tour</span>
        </button>

        {/* Help & Guide Link */}
        <Link
          to="/guide"
          title="Help & Operations Manual"
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200/80"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {role === 'facilities_manager'
                ? NIU_CONFIG.facilitiesLead.displayName
                : role === 'technician'
                ? 'Assigned Technician'
                : role === 'safety_officer'
                ? 'Campus Safety Officer'
                : role === 'campus_admin'
                ? 'Campus Administrator'
                : 'Faculty Member'}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              {role === 'facilities_manager'
                ? 'Facilities Manager (Demo - Unverified)'
                : `${role.replace('_', ' ')} (Demo)`}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
