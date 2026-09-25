import React from 'react';
import {
  GraduationCap,
  LogOut,
  RefreshCw,
  School,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { PWAInstallButton } from './PWAInstallButton';
import { BackgroundSelector } from './BackgroundSelector';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenOnboarding,
}) => {
  const { currentUser, userProfile, teacherProfile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between">
      {/* Brand & Portal title */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                Tutor<span className="text-indigo-600">Flow</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  userProfile?.role === 'teacher'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                {userProfile?.role || 'User'}
              </span>
            </div>
            {userProfile?.role === 'teacher' && (
              <p className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[220px]">
                {teacherProfile?.instituteName || 'Tuition Academy'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Background Theme Selector */}
        <BackgroundSelector />

        {/* PWA Install Button */}
        <PWAInstallButton variant="nav" />

        {/* Setup Wizard shortcut for teachers */}
        {userProfile?.role === 'teacher' && onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            title="Open Onboarding Wizard"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/70 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Setup Guide</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase overflow-hidden shrink-0">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{userProfile?.displayName?.charAt(0) || 'U'}</span>
            )}
          </div>

          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
              {userProfile?.displayName || 'Educator'}
            </p>
            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
              {userProfile?.email}
            </p>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
