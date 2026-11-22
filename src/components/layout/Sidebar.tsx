import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  GraduationCap,
  UserCheck,
  CalendarRange,
  FileSpreadsheet,
  Bell,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { NavItem } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  unmarkedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unmarkedCount = 0,
}) => {
  const { user, institution, role, signOut, isDemoMode, setDemoUser } = useAuth();

  const isAdmin = role === 'admin';

  const navItems: { id: NavItem; label: string; icon: React.ElementType; adminOnly?: boolean; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-attendance', label: 'Daily Attendance', icon: CalendarCheck, badge: unmarkedCount > 0 ? unmarkedCount : undefined },
    { id: 'monthly-register', label: 'Monthly Register', icon: CalendarDays },
    { id: 'students', label: 'Students', icon: Users, adminOnly: false },
    { id: 'classes', label: 'Classes & Sections', icon: GraduationCap, adminOnly: true },
    { id: 'teachers', label: 'Teachers', icon: UserCheck, adminOnly: true },
    { id: 'calendar', label: 'School Calendar', icon: CalendarRange, adminOnly: true },
    { id: 'reports', label: 'Reports Hub', icon: FileSpreadsheet },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 h-screen sticky top-0 no-print select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-white truncate">
              {institution?.name || 'School Attendance'}
            </h1>
            <p className="text-xs text-slate-400 font-mono truncate">
              {institution?.code || 'INST-SYS'} · {isAdmin ? 'Admin Console' : 'Teacher Portal'}
            </p>
          </div>
        </div>

        {/* Demo Mode Toggle Sandbox Switcher */}
        {isDemoMode && (
          <div className="mt-3 p-2 bg-slate-800/80 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between text-xs text-amber-400 font-medium mb-1.5">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Sandbox Mode
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Demo</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                onClick={() => setDemoUser('admin')}
                className={`py-1 px-2 rounded font-medium transition-colors ${
                  isAdmin
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setDemoUser('teacher')}
                className={`py-1 px-2 rounded font-medium transition-colors ${
                  !isAdmin
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-white truncate">
              {user?.full_name || 'Logged In User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate capitalize">
              {role || 'Teacher'} · {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
