import React from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileText,
  GraduationCap,
  HardDrive,
  LayoutDashboard,
  Megaphone,
  Menu,
  School,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts = {} }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'Classes', icon: School, count: counts.classes },
    { id: 'students', label: 'Students', icon: Users, count: counts.students },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'assignments', label: 'Assignments', icon: FileText, count: counts.assignments },
    { id: 'materials', label: 'Study Materials & AI', icon: BookOpen },
    { id: 'storage', label: 'Storage Collection', icon: HardDrive },
    { id: 'fees', label: 'Fees & Payments', icon: CreditCard, count: counts.pendingFees },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
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
      <aside className="hidden md:flex flex-col w-64 bg-white/70 backdrop-blur-md border-r border-slate-200/80 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
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
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 border border-indigo-100 text-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-950">TutorFlow AI Assistant</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Generate study diagrams in 1K/2K/4K and solve complex problems with High Thinking.
            </p>
            <button
              onClick={() => setActiveTab('materials')}
              className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              Open AI Studio &rarr;
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
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
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.id === 'classes' && (counts.classes || 0) > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {counts.classes}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto w-72 max-w-[80vw] bg-white h-full shadow-2xl p-5 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-1 flex-1 overflow-y-auto">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
