import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  FileSpreadsheet,
  Menu,
} from 'lucide-react';
import { NavItem } from '../../types/models';

interface MobileNavProps {
  activeTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onOpenMobileDrawer: () => void;
  unmarkedCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileDrawer,
  unmarkedCount = 0,
}) => {
  const tabs: { id: NavItem; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-attendance', label: 'Mark Attendance', icon: CalendarCheck, badge: unmarkedCount > 0 ? unmarkedCount : undefined },
    { id: 'monthly-register', label: 'Register', icon: CalendarDays },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),8px)] flex items-center justify-around no-print"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center min-w-[58px] min-h-[46px] py-1 px-1.5 rounded-lg text-xs font-medium transition-colors relative touch-manipulation ${
              isActive
                ? 'text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 active:bg-slate-100'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onOpenMobileDrawer}
        className="flex flex-col items-center justify-center min-w-[58px] min-h-[46px] py-1 px-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 active:bg-slate-100 transition-colors touch-manipulation"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">More</span>
      </button>
    </nav>
  );
};
