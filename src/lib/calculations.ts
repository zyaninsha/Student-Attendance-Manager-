import { AttendanceStatus } from '../types/database.types';
import { StudentAttendanceSummary, Student } from '../types/models';

export interface ThresholdConfig {
  good: number;     // e.g. 90
  warning: number;  // e.g. 75
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  good: 90.0,
  warning: 75.0,
};

/**
 * Calculates student attendance metrics according to strict institutional formulas:
 * School Days = P + A + L (excluding H and unmarked)
 * Percentage = (P / School Days) * 100
 */
export function calculateStudentSummary(
  student: Student,
  statuses: (AttendanceStatus | null | undefined)[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): StudentAttendanceSummary {
  let present = 0;
  let absent = 0;
  let leave = 0;
  let holiday = 0;
  let unmarked = 0;

  for (const s of statuses) {
    if (s === 'P') present++;
    else if (s === 'A') absent++;
    else if (s === 'L') leave++;
    else if (s === 'H') holiday++;
    else unmarked++;
  }

  const schoolDays = present + absent + leave;
  let percentage: number | null = null;
  let rating: 'Good' | 'Warning' | 'Low' | 'Not Started' = 'Not Started';

  if (schoolDays > 0) {
    percentage = Math.round((present / schoolDays) * 1000) / 10; // 1 decimal place e.g. 94.2%
    if (percentage >= thresholds.good) {
      rating = 'Good';
    } else if (percentage >= thresholds.warning) {
      rating = 'Warning';
    } else {
      rating = 'Low';
    }
  }

  return {
    student,
    present,
    absent,
    leave,
    holiday,
    unmarked,
    schoolDays,
    percentage,
    rating,
  };
}

/**
 * Evaluates an arbitrary attendance percentage against institutional thresholds.
 */
export function getAttendanceRating(
  percentage: number | null,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): 'Good' | 'Warning' | 'Low' | 'Not Started' {
  if (percentage === null || isNaN(percentage)) return 'Not Started';
  if (percentage >= thresholds.good) return 'Good';
  if (percentage >= thresholds.warning) return 'Warning';
  return 'Low';
}

/**
 * Color classes for threshold ratings
 */
export function getRatingBadgeClasses(rating: 'Good' | 'Warning' | 'Low' | 'Not Started'): string {
  switch (rating) {
    case 'Good':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
    case 'Warning':
      return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    case 'Low':
      return 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
    case 'Not Started':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-300';
  }
}
