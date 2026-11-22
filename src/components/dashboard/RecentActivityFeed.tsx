import React from 'react';
import { History, Clock, UserCheck } from 'lucide-react';
import { AttendanceAuditLog } from '../../types/models';
import { AttendanceBadge } from '../common/AttendanceBadge';
import { AttendanceStatus } from '../../types/database.types';

interface RecentActivityFeedProps {
  logs: AttendanceAuditLog[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Attendance Activity</h3>
          <p className="text-xs text-slate-500">Live audit trail of marking submissions and edits</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {logs.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500">No activity recorded today yet.</p>
        ) : (
          logs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  {log.old_status && (
                    <>
                      <AttendanceBadge status={log.old_status as AttendanceStatus} size="sm" />
                      <span className="text-slate-400 font-bold">→</span>
                    </>
                  )}
                  <AttendanceBadge status={log.new_status as AttendanceStatus} size="sm" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {log.student_name || `Student #${log.student_id.slice(0, 8)}`}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate">
                    {log.reason || 'Attendance marked'} · Date: {log.attendance_date}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
