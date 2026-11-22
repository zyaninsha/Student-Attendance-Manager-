import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { NavItem } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Users,
  GraduationCap,
  UserCheck,
  CalendarRange,
  Bell,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  unmarkedCount?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  unmarkedCount = 0,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { role, signOut, isDemoMode, setDemoUser } = useAuth();
  const isAdmin = role === 'admin';

  const secondaryMobileItems: { id: NavItem; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'students', label: 'Students Directory', icon: Users },
    { id: 'classes', label: 'Classes & Sections', icon: GraduationCap, adminOnly: true },
    { id: 'teachers', label: 'Teacher Assignments', icon: UserCheck, adminOnly: true },
    { id: 'calendar', label: 'School Calendar', icon: CalendarRange, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  const handleMobileNavClick = (tab: NavItem) => {
    onSelectTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        unmarkedCount={unmarkedCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header activeTab={activeTab} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        unmarkedCount={unmarkedCount}
      />

      {/* Mobile Slide-Over Drawer for Secondary Pages */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-72 bg-slate-900 text-white h-full flex flex-col shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sm text-white">All Modules</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sandbox Mode Switcher in Drawer */}
            {isDemoMode && (
              <div className="mt-3 p-2 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-xs text-amber-400 font-medium mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Sandbox Switcher
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <button
                    onClick={() => { setDemoUser('admin'); setMobileDrawerOpen(false); }}
                    className={`py-1 rounded font-medium ${isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => { setDemoUser('teacher'); setMobileDrawerOpen(false); }}
                    className={`py-1 rounded font-medium ${!isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {secondaryMobileItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  signOut();
                  setMobileDrawerOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
