import React, { useState } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle2, Shield, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface InAppAlert {
  id: string;
  type: 'warning' | 'reminder' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export const NotificationsView: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [alerts, setAlerts] = useState<InAppAlert[]>([
    {
      id: 'al-1',
      type: 'warning',
      title: 'Low Attendance Notice: Liam Alexander',
      message: 'Student Liam Alexander (STU-2026-0042) has fallen to 66.7% attendance, below the 75% school threshold.',
      timestamp: 'Today at 08:30 AM',
      isRead: false,
    },
    {
      id: 'al-2',
      type: 'reminder',
      title: 'Daily Register Submission Status',
      message: 'Grade 5 - Section A daily attendance has been recorded. All 32 students verified.',
      timestamp: 'Today at 09:15 AM',
      isRead: false,
    },
    {
      id: 'al-3',
      type: 'info',
      title: 'Monthly Register Audit Ready',
      message: 'The monthly register for October 2026 is ready for review and landscape export.',
      timestamp: 'Yesterday at 04:00 PM',
      isRead: true,
    },
  ]);

  const [notifyLow, setNotifyLow] = useState(true);
  const [notifyUnsubmitted, setNotifyUnsubmitted] = useState(true);
  const [savedSettings, setSavedSettings] = useState(false);

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column: Alerts Feed on Left, Preferences on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Alerts Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">In-App School Alerts</h3>
                <p className="text-xs text-slate-500">Real-time notifications for daily registers and attendance limits</p>
              </div>
            </div>
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-colors ${
                  !alert.isRead
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      alert.type === 'warning'
                        ? 'bg-red-50 text-red-600'
                        : alert.type === 'reminder'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {alert.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                    {alert.type === 'reminder' && <CheckCircle2 className="w-4 h-4" />}
                    {alert.type === 'info' && <Clock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {alert.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: In-App Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Settings className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Notification Rules</h3>
              <p className="text-xs text-slate-500">Configure what triggers alerts</p>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyLow}
                  onChange={(e) => setNotifyLow(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Low Attendance Warnings (&lt;75%)</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6.5">
                Triggers an in-app alert when a student's calculated rate falls below the safety threshold.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyUnsubmitted}
                  onChange={(e) => setNotifyUnsubmitted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Daily Submission Reminders</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6.5">
                Displays a badge reminder if any assigned section is unmarked by 10:00 AM on school days.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {savedSettings ? 'Preferences Updated!' : 'Save Notification Preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
