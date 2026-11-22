import React from 'react';
import { AlertTriangle, Phone, ExternalLink } from 'lucide-react';
import { StudentAttendanceSummary } from '../../types/models';

interface LowAttendanceTableProps {
  students: StudentAttendanceSummary[];
  onSelectStudent?: (studentId: string) => void;
}

export const LowAttendanceTable: React.FC<LowAttendanceTableProps> = ({
  students,
  onSelectStudent,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Low Attendance Watchlist (&lt; 75%)
            </h3>
            <p className="text-xs text-slate-500">
              Students at academic risk requiring guardian contact or intervention
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-800 rounded-full tabular-nums">
          {students.length} Students
        </span>
      </div>

      {students.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          No students currently below the minimum 75% attendance threshold. Excellent!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Student ID</th>
                <th className="py-2.5 px-4 font-semibold">Roll</th>
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Class & Sec</th>
                <th className="py-2.5 px-4 font-semibold text-center">P / School Days</th>
                <th className="py-2.5 px-4 font-semibold text-right">Attendance %</th>
                <th className="py-2.5 px-4 font-semibold">Guardian Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((item) => (
                <tr key={item.student.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">
                    {item.student.student_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {item.student.roll_number}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.student.full_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {item.student.class_name} {item.student.section_name && `· ${item.student.section_name}`}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums text-slate-600">
                    <span className="font-semibold text-emerald-700">{item.present}</span> / {item.schoolDays}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200 tabular-nums">
                      {item.percentage !== null ? `${item.percentage}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.student.guardian_phone ? (
                      <a
                        href={`tel:${item.student.guardian_phone}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{item.student.guardian_phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">No phone recorded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
