import React from 'react';
import {
  GraduationCap,
  LogOut,
  Sparkles,
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
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-xs relative">
      {/* Top Colorful Luminous Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-amber-400 to-cyan-400 opacity-90" />

      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Portal title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-lg">
                  Tutor<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Flow</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-2xs hidden min-[400px]:inline-flex ${
                    userProfile?.role === 'teacher'
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/80'
                      : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/80'
                  }`}
                >
                  {userProfile?.role === 'teacher' ? 'Educator' : 'Student'}
                </span>
              </div>
              {userProfile?.role === 'teacher' && (
                <p className="hidden min-[480px]:block text-[10px] sm:text-[11px] font-medium text-slate-500 truncate max-w-[100px] sm:max-w-[240px]">
                  {teacherProfile?.instituteName || 'Tuition Academy'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Background Theme Selector */}
          <BackgroundSelector compact />

          {/* PWA Install Button */}
          <PWAInstallButton variant="nav" />

          {/* Setup Wizard shortcut for teachers */}
          {userProfile?.role === 'teacher' && onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              title="Open Setup Guide"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 text-xs font-bold border border-indigo-200/80 transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin [animation-duration:8s]" />
              <span>Setup Guide</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200/80">
            <div className="relative group/avatar hidden min-[450px]:block">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-indigo-700 font-extrabold text-xs uppercase overflow-hidden">
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
              </div>
            </div>

            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {userProfile?.displayName || 'Educator'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">
                {userProfile?.email}
              </p>
            </div>

            <button
              onClick={logout}
              title="Log Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
