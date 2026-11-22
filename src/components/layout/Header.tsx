import React from 'react';
import { Calendar, Shield, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavItem } from '../../types/models';

interface HeaderProps {
  activeTab: NavItem;
  sessionName?: string;
  onOpenMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  sessionName = '2026-2027 Academic Year',
}) => {
  const { user, role, signOut, isDemoMode } = useAuth();

  const titles: Record<NavItem, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Dashboard', subtitle: 'Live attendance telemetry & analytics' },
    'daily-attendance': { title: 'Daily Attendance Sheet', subtitle: 'Fast batch marking and verification' },
    'monthly-register': { title: 'Monthly Attendance Register', subtitle: 'Full 31-day matrix with totals' },
    students: { title: 'Student Directory', subtitle: 'Profiles, enrollment status & roster import' },
    classes: { title: 'Classes & Sections', subtitle: 'Academic organization & grade levels' },
    teachers: { title: 'Teacher Management', subtitle: 'Directory & class section authorization' },
    calendar: { title: 'School Calendar', subtitle: 'Holidays, academic terms & working days' },
    reports: { title: 'Reports & Analytics Hub', subtitle: 'Aggregated summaries and exportable audits' },
    notifications: { title: 'In-App Notifications', subtitle: 'Attendance alerts & submission checks' },
    settings: { title: 'Institution Settings', subtitle: 'School profile, thresholds & working days' },
  };

  const currentInfo = titles[activeTab] || { title: 'Attendance System', subtitle: 'School Portal' };
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs no-print">
      {/* Zone 1: Current Page Title */}
      <div className="min-w-0">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 truncate">
          {currentInfo.title}
        </h2>
        <p className="text-xs text-slate-500 hidden sm:block truncate">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Zone 2 & 3: Academic Session, Date, and User Profile Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Academic Session & Date Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-800">{sessionName}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-600">{todayFormatted}</span>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
              role === 'admin'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {role === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-blue-700" />
            ) : (
              <User className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span>{role === 'admin' ? 'Administrator' : 'Teacher'}</span>
          </span>

          {isDemoMode && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Sandbox
            </span>
          )}

          {/* Quick Sign Out for Mobile Header */}
          <button
            onClick={signOut}
            title="Sign Out"
            className="md:hidden p-2 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
