import React from 'react';
import { AttendanceStatus } from '../../types/database.types';

interface AttendanceBadgeProps {
  status: AttendanceStatus | '—' | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const AttendanceBadge: React.FC<AttendanceBadgeProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const normalized = status ? status.toUpperCase() : '—';

  let colorClasses = '';
  let letter = '—';
  let label = 'Unmarked';

  switch (normalized) {
    case 'P':
      // Present = green + bold white text
      colorClasses = 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-xs';
      letter = 'P';
      label = 'Present';
      break;
    case 'A':
      // Absent = bright red + bold white text
      colorClasses = 'bg-red-600 text-white font-bold border-red-700 shadow-xs';
      letter = 'A';
      label = 'Absent';
      break;
    case 'L':
      // Leave = amber yellow + bold white text
      colorClasses = 'bg-amber-500 text-white font-bold border-amber-600 shadow-xs';
      letter = 'L';
      label = 'Leave';
      break;
    case 'H':
      // Holiday = light sky blue + bold white text
      colorClasses = 'bg-sky-500 text-white font-bold border-sky-600 shadow-xs';
      letter = 'H';
      label = 'Holiday';
      break;
    default:
      // Unmarked = slate grey + bold white text
      colorClasses = 'bg-slate-400 text-white font-medium border-slate-500';
      letter = '—';
      label = 'Unmarked';
      break;
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={`${label} (${letter})`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-md border ${sizeClasses} ${colorClasses} shrink-0 transition-colors select-none`}
        aria-label={label}
      >
        {letter}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
          {label}
        </span>
      )}
    </span>
  );
};
