/**
 * Date and calendar utilities for Monthly Registers, Academic Years, and Leap Years.
 */

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

export interface MonthDayInfo {
  dayNumber: number;        // 1..31
  dateString: string;       // YYYY-MM-DD
  dayNameShort: string;     // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  isWeekend: boolean;
  isToday: boolean;
}

export function generateMonthDays(year: number, monthZeroIndexed: number): MonthDayInfo[] {
  const daysCount = getDaysInMonth(year, monthZeroIndexed);
  const todayStr = getTodayDateString();
  const days: MonthDayInfo[] = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let d = 1; d <= daysCount; d++) {
    const dateObj = new Date(year, monthZeroIndexed, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    const mm = String(monthZeroIndexed + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateString = `${year}-${mm}-${dd}`;

    days.push({
      dayNumber: d,
      dateString,
      dayNameShort: dayNames[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: dateString === todayStr,
    });
  }

  return days;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
