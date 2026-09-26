import React from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileText,
  HardDrive,
  LayoutDashboard,
  Megaphone,
  Menu,
  School,
  Settings,
  Sparkles,
  Users,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts?: {
    classes?: number;
    students?: number;
    assignments?: number;
    pendingFees?: number;
  };
}

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  activeGradient: string;
  iconBg: string;
  iconColor: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts = {} }) => {
  const { logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const navItems: NavItemDef[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      activeGradient: 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 shadow-indigo-500/30',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      id: 'classes',
      label: 'Classes & Batches',
      icon: School,
      count: counts.classes,
      activeGradient: 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 shadow-sky-500/30',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      id: 'students',
      label: 'Students & Roster',
      icon: Users,
      count: counts.students,
      activeGradient: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 shadow-emerald-500/30',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'attendance',
      label: 'Attendance Register',
      icon: CalendarCheck,
      activeGradient: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-amber-500/30',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      id: 'assignments',
      label: 'Assignments & Grading',
      icon: FileText,
      count: counts.assignments,
      activeGradient: 'bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 shadow-rose-500/30',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      id: 'materials',
      label: 'Study Materials & AI',
      icon: BookOpen,
      activeGradient: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-purple-500/30',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      id: 'storage',
      label: 'Cloud File Library',
      icon: HardDrive,
      activeGradient: 'bg-gradient-to-r from-cyan-500 via-teal-600 to-blue-600 shadow-cyan-500/30',
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      id: 'fees',
      label: 'Fees & Invoicing',
      icon: CreditCard,
      count: counts.pendingFees,
      activeGradient: 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-emerald-600/30',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'announcements',
      label: 'Broadcasts',
      icon: Megaphone,
      activeGradient: 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 shadow-orange-500/30',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: BarChart3,
      activeGradient: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-violet-500/30',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      id: 'settings',
      label: 'Institute Settings',
      icon: Settings,
      activeGradient: 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 shadow-slate-700/30',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
  ];

  // Mobile bottom quick items
  const bottomItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'classes', label: 'Classes', icon: School },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'assignments', label: 'Tasks', icon: FileText },
    { id: 'more', label: 'More', icon: Menu, isMenu: true },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/70 p-3.5 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
                  isActive
                    ? `${item.activeGradient} text-white shadow-md`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/90 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : `${item.iconBg} ${item.iconColor}`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feature Callout at bottom */}
        <div className="mt-auto pt-4">
          <div className="relative p-4 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/70 overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin [animation-duration:10s]" />
              </div>
              <span className="text-xs font-black text-indigo-950">AI Studio Tutor</span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 leading-snug">
              Instant study diagrams, high-thinking summaries, and lesson flashcards.
            </p>
            <button
              onClick={() => setActiveTab('materials')}
              className="mt-3 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[11px] font-bold shadow-xs shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore Studio</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMenu) {
                  setMobileDrawerOpen(true);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                {item.id === 'classes' && (counts.classes || 0) > 0 && (
                  <span className="absolute -top-0.5 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {counts.classes}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto w-72 max-w-[82vw] bg-white/95 backdrop-blur-2xl h-full shadow-2xl p-5 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-slate-900 text-sm">Navigation</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-1.5 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? `${item.activeGradient} text-white shadow-sm`
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-white/20 text-white' : `${item.iconBg} ${item.iconColor}`
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Direct Logout Option in Mobile Drawer */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  logout();
                  setMobileDrawerOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer active:scale-95 transition-all"
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                  <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
