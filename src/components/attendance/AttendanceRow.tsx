import React from 'react';
import { AttendanceStatus } from '../../types/database.types';
import { Student } from '../../types/models';

interface AttendanceRowProps {
  student: Student;
  status: AttendanceStatus | null;
  remarks: string;
  isLocked?: boolean;
  onStatusChange: (status: AttendanceStatus) => void;
  onRemarksChange: (remarks: string) => void;
}

export const AttendanceRow: React.FC<AttendanceRowProps> = ({
  student,
  status,
  remarks,
  isLocked = false,
  onStatusChange,
  onRemarksChange,
}) => {
  const buttons: { key: AttendanceStatus; label: string; activeClass: string; inactiveClass: string }[] = [
    {
      key: 'P',
      label: 'P',
      activeClass: 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-600 shadow-sm',
      inactiveClass: 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700',
    },
    {
      key: 'A',
      label: 'A',
      activeClass: 'bg-red-600 text-white font-bold ring-2 ring-red-600 shadow-sm',
      inactiveClass: 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700',
    },
    {
      key: 'L',
      label: 'L',
      activeClass: 'bg-amber-500 text-white font-bold ring-2 ring-amber-500 shadow-sm',
      inactiveClass: 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700',
    },
    {
      key: 'H',
      label: 'H',
      activeClass: 'bg-sky-500 text-white font-bold ring-2 ring-sky-500 shadow-sm',
      inactiveClass: 'bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700',
    },
  ];

  return (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs sm:text-sm">
      {/* Roll Number */}
      <td className="py-3 px-3 sm:px-4 font-mono font-medium text-slate-600 tabular-nums">
        {student.roll_number}
      </td>

      {/* Student ID */}
      <td className="py-3 px-3 sm:px-4 font-mono text-slate-500 hidden sm:table-cell">
        {student.student_id}
      </td>

      {/* Full Name */}
      <td className="py-3 px-3 sm:px-4 font-bold text-slate-900">
        <div className="flex flex-col">
          <span>{student.full_name}</span>
          <span className="sm:hidden font-mono text-[10px] text-slate-400 font-normal">
            {student.student_id}
          </span>
        </div>
      </td>

      {/* Attendance Quick Toggles (P, A, L, H) */}
      <td className="py-3 px-3 sm:px-4">
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg border border-slate-200">
          {buttons.map((btn) => {
            const isSelected = status === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                disabled={isLocked}
                onClick={() => onStatusChange(btn.key)}
                className={`w-8 h-8 rounded-md text-xs font-bold transition-all flex items-center justify-center select-none ${
                  isSelected ? btn.activeClass : btn.inactiveClass
                } disabled:opacity-50`}
                title={`Mark ${btn.key === 'P' ? 'Present' : btn.key === 'A' ? 'Absent' : btn.key === 'L' ? 'Leave' : 'Holiday'}`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </td>

      {/* Remarks Input */}
      <td className="py-3 px-3 sm:px-4">
        <input
          type="text"
          value={remarks}
          disabled={isLocked}
          onChange={(e) => onRemarksChange(e.target.value)}
          placeholder={status === 'L' ? 'Reason for leave...' : status === 'A' ? 'Unexcused / reason...' : 'Remarks (optional)...'}
          className="w-full text-xs py-1.5 px-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-50 text-slate-700"
        />
      </td>
    </tr>
  );
};
