import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Download,
  Printer,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceBadge } from '../common/AttendanceBadge';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Student, SchoolClass, SchoolSection } from '../../types/models';
import { AttendanceStatus } from '../../types/database.types';
import { generateMonthDays, MONTH_NAMES } from '../../lib/dateUtils';
import { calculateStudentSummary, getRatingBadgeClasses } from '../../lib/calculations';
import { exportToCSV, exportToXLSX, triggerPrint } from '../../lib/exportUtils';

export const MonthlyRegisterView: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const currentDate = new Date();

  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMatrix, setAttendanceMatrix] = useState<Map<string, Map<string, AttendanceStatus>>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Generate calendar days for this month (1..28/29/30/31)
  const monthDays = useMemo(
    () => generateMonthDays(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  // 1. Load Classes and Sections
  useEffect(() => {
    const loadHierarchy = async () => {
      if (!isSupabaseConfigured || isDemoMode) {
        setClasses([
          { id: 'c-g5', institution_id: 'demo', name: 'Grade 5', numeric_order: 5 },
          { id: 'c-g6', institution_id: 'demo', name: 'Grade 6', numeric_order: 6 },
        ]);
        setSections([
          { id: 'sec-g5-a', institution_id: 'demo', class_id: 'c-g5', name: 'Section A' },
          { id: 'sec-g6-a', institution_id: 'demo', class_id: 'c-g6', name: 'Section A' },
        ]);
        setSelectedClassId('c-g5');
        setSelectedSectionId('sec-g5-a');
        return;
      }

      try {
        const { data: cls } = await supabase.from('classes').select('*').order('numeric_order');
        const { data: sec } = await supabase.from('sections').select('*').order('name');
        if (cls) setClasses(cls);
        if (sec) {
          setSections(sec);
          if (cls && cls.length > 0) {
            setSelectedClassId(cls[0].id);
            const matchingSec = sec.find((s: any) => s.class_id === cls[0].id);
            if (matchingSec) setSelectedSectionId(matchingSec.id);
          }
        }
      } catch (err) {
        console.error('Error loading register hierarchy:', err);
      }
    };
    loadHierarchy();
  }, [isDemoMode]);

  const availableSections = sections.filter((s) => s.class_id === selectedClassId);

  // 2. Fetch Students and Attendance Matrix
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId) return;

    const fetchMonthlyData = async () => {
      setIsLoading(true);

      if (!isSupabaseConfigured || isDemoMode) {
        // Generate high-fidelity demo roster with realistic attendance patterns
        const demoRoster: Student[] = [
          { id: 's1', institution_id: 'demo', student_id: 'STU-001', roll_number: '01', full_name: 'Ava Robinson', class_id: selectedClassId, section_id: selectedSectionId, admission_date: '2026-08-15', status: 'active' },
          { id: 's2', institution_id: 'demo', student_id: 'STU-002', roll_number: '02', full_name: 'Benjamin Hayes', class_id: selectedClassId, section_id: selectedSectionId, admission_date: '2026-08-15', status: 'active' },
          { id: 's3', institution_id: 'demo', student_id: 'STU-003', roll_number: '03', full_name: 'Charlotte Chen', class_id: selectedClassId, section_id: selectedSectionId, admission_date: '2026-08-15', status: 'active' },
          { id: 's4', institution_id: 'demo', student_id: 'STU-004', roll_number: '04', full_name: 'Daniel Miller', class_id: selectedClassId, section_id: selectedSectionId, admission_date: '2026-08-15', status: 'active' },
          { id: 's5', institution_id: 'demo', student_id: 'STU-005', roll_number: '05', full_name: 'Emma Wilson', class_id: selectedClassId, section_id: selectedSectionId, admission_date: '2026-08-15', status: 'active' },
          { id: 's6', institution_id: 'demo', student_id: 'STU-006', roll_number: '06', full_name: 'Finn O’Connor', class_id: selectedClassId, section_id: selectedSectionId, admission_date: '2026-08-15', status: 'active' },
          { id: 's7', institution_id: 'demo', student_id: 'STU-007', roll_number: '07', full_name: 'Grace Patel', class_id: selectedClassId, section_id: selectedSectionId, admission_date: '2026-08-15', status: 'active' },
        ];
        setStudents(demoRoster);

        const matrix = new Map<string, Map<string, AttendanceStatus>>();
        demoRoster.forEach((stu, stuIdx) => {
          const studentMap = new Map<string, AttendanceStatus>();
          monthDays.forEach((day, dayIdx) => {
            if (day.isWeekend) {
              studentMap.set(day.dateString, 'H');
            } else if (dayIdx < 20) {
              // Past days
              if (stuIdx === 3 && (dayIdx === 4 || dayIdx === 5 || dayIdx === 11)) {
                studentMap.set(day.dateString, 'A');
              } else if (stuIdx === 1 && dayIdx === 8) {
                studentMap.set(day.dateString, 'L');
              } else {
                studentMap.set(day.dateString, 'P');
              }
            }
          });
          matrix.set(stu.id, studentMap);
        });
        setAttendanceMatrix(matrix);
        setIsLoading(false);
        return;
      }

      try {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', selectedClassId)
          .eq('section_id', selectedSectionId)
          .eq('status', 'active')
          .order('roll_number');

        const startDate = monthDays[0].dateString;
        const endDate = monthDays[monthDays.length - 1].dateString;

        const { data: records } = await supabase
          .from('attendance_records')
          .select('student_id, attendance_date, status')
          .eq('class_id', selectedClassId)
          .eq('section_id', selectedSectionId)
          .gte('attendance_date', startDate)
          .lte('attendance_date', endDate);

        if (studentsData) setStudents(studentsData as Student[]);

        const matrix = new Map<string, Map<string, AttendanceStatus>>();
        if (records) {
          records.forEach((r: any) => {
            if (!matrix.has(r.student_id)) {
              matrix.set(r.student_id, new Map());
            }
            matrix.get(r.student_id)!.set(r.attendance_date, r.status as AttendanceStatus);
          });
        }
        setAttendanceMatrix(matrix);
      } catch (err) {
        console.error('Error fetching monthly register:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedClassId, selectedSectionId, selectedYear, selectedMonth, isDemoMode, monthDays]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Calculate summaries for filtered students
  const studentSummaries = useMemo(() => {
    return filteredStudents.map((student) => {
      const studentMap = attendanceMatrix.get(student.id);
      const statuses = monthDays.map((d) => (studentMap ? studentMap.get(d.dateString) || null : null));
      return calculateStudentSummary(student, statuses);
    });
  }, [filteredStudents, attendanceMatrix, monthDays]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Roll No',
      'Student ID',
      'Student Name',
      ...monthDays.map((d) => `Day ${d.dayNumber} (${d.dayNameShort})`),
      'Present (P)',
      'Absent (A)',
      'Leave (L)',
      'School Days',
      'Attendance %',
      'Rating',
    ];

    const rows = studentSummaries.map((summary) => {
      const studentMap = attendanceMatrix.get(summary.student.id);
      const dayValues = monthDays.map((d) => (studentMap ? studentMap.get(d.dateString) || '—' : '—'));
      return [
        summary.student.roll_number,
        summary.student.student_id,
        summary.student.full_name,
        ...dayValues,
        summary.present,
        summary.absent,
        summary.leave,
        summary.schoolDays,
        summary.percentage !== null ? `${summary.percentage}%` : 'Not Started',
        summary.rating,
      ];
    });

    const filename = `Attendance_Register_${MONTH_NAMES[selectedMonth]}_${selectedYear}`;
    exportToCSV(filename, headers, rows);
  };

  // Export to Excel XLSX
  const handleExportXLSX = () => {
    const headers = [
      'Roll No',
      'Student ID',
      'Student Name',
      ...monthDays.map((d) => `${d.dayNumber} ${d.dayNameShort}`),
      'Present',
      'Absent',
      'Leave',
      'School Days',
      'Attendance %',
      'Rating',
    ];

    const rows = studentSummaries.map((summary) => {
      const studentMap = attendanceMatrix.get(summary.student.id);
      const dayValues = monthDays.map((d) => (studentMap ? studentMap.get(d.dateString) || '—' : '—'));
      return [
        summary.student.roll_number,
        summary.student.student_id,
        summary.student.full_name,
        ...dayValues,
        summary.present,
        summary.absent,
        summary.leave,
        summary.schoolDays,
        summary.percentage !== null ? `${summary.percentage}%` : 'Not Started',
        summary.rating,
      ];
    });

    const filename = `Monthly_Register_${MONTH_NAMES[selectedMonth]}_${selectedYear}`;
    exportToXLSX(filename, `${MONTH_NAMES[selectedMonth]} ${selectedYear}`, headers, rows);
  };

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Class';
  const selectedSectionName = sections.find((s) => s.id === selectedSectionId)?.name || 'Section';

  return (
    <div className="space-y-5 print-container">
      {/* Top Filter & Export Bar (Hidden in Print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div>
            <label htmlFor="reg-month" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Month & Year
            </label>
            <div className="flex items-center gap-1.5">
              <select
                id="reg-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Selector */}
          <div>
            <label htmlFor="reg-class" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              id="reg-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-[130px]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label htmlFor="reg-section" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              id="reg-section"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-[110px]"
            >
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or roll..."
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Official Print Header (Only visible on paper printouts) */}
      <div className="hidden print:block mb-4 text-center border-b pb-2">
        <h1 className="text-xl font-bold uppercase tracking-wider text-black">
          Monthly Attendance Register
        </h1>
        <p className="text-xs text-gray-700">
          {selectedClassName} - {selectedSectionName} · Month: {MONTH_NAMES[selectedMonth]} {selectedYear}
        </p>
      </div>

      {/* 31-Day Excel-Style Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-2 font-bold w-10 text-center sticky left-0 bg-slate-50 z-20 shadow-xs">
                  #
                </th>
                <th className="py-2.5 px-2.5 font-bold w-12 text-center sticky left-10 bg-slate-50 z-20">
                  Roll
                </th>
                <th className="py-2.5 px-3 font-bold min-w-[140px] sticky left-22 bg-slate-50 z-20 border-r border-slate-200 shadow-xs">
                  Student Name
                </th>

                {/* Day Columns (1..28/29/30/31) */}
                {monthDays.map((d) => (
                  <th
                    key={d.dayNumber}
                    className={`py-2 px-1 text-center font-mono w-7 shrink-0 ${
                      d.isWeekend
                        ? 'bg-slate-100 text-slate-500'
                        : d.isToday
                        ? 'bg-blue-50 text-blue-800 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <div>{d.dayNumber}</div>
                    <div className="text-[9px] font-normal opacity-70">{d.dayNameShort.slice(0, 1)}</div>
                  </th>
                ))}

                {/* Summary Metrics Columns */}
                <th className="py-2.5 px-2 text-center font-bold text-emerald-800 bg-emerald-50/50 border-l border-slate-200 w-10">
                  P
                </th>
                <th className="py-2.5 px-2 text-center font-bold text-red-800 bg-red-50/50 w-10">
                  A
                </th>
                <th className="py-2.5 px-2 text-center font-bold text-amber-800 bg-amber-50/50 w-10">
                  L
                </th>
                <th className="py-2.5 px-2 text-center font-bold text-slate-700 w-12">
                  Days
                </th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900 w-16">
                  %
                </th>
                <th className="py-2.5 px-2.5 text-center font-bold text-slate-700 w-20">
                  Rating
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {studentSummaries.map((summary, idx) => {
                const studentMap = attendanceMatrix.get(summary.student.id);

                return (
                  <tr key={summary.student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Serial No */}
                    <td className="py-2 px-2 text-center text-slate-400 font-sans tabular-nums sticky left-0 bg-white z-10">
                      {idx + 1}
                    </td>

                    {/* Roll No */}
                    <td className="py-2 px-2.5 text-center font-bold text-slate-700 tabular-nums sticky left-10 bg-white z-10">
                      {summary.student.roll_number}
                    </td>

                    {/* Student Name */}
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 truncate max-w-[160px] sticky left-22 bg-white z-10 border-r border-slate-200">
                      {summary.student.full_name}
                    </td>

                    {/* 31 Day Cells */}
                    {monthDays.map((d) => {
                      const status = studentMap ? studentMap.get(d.dateString) : null;
                      return (
                        <td
                          key={d.dayNumber}
                          className={`py-1.5 px-0.5 text-center font-sans ${
                            d.isWeekend ? 'bg-slate-50/60' : d.isToday ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <AttendanceBadge status={status} size="sm" />
                        </td>
                      );
                    })}

                    {/* Present Count */}
                    <td className="py-2 px-2 text-center font-bold text-emerald-700 tabular-nums border-l border-slate-200 bg-emerald-50/20">
                      {summary.present}
                    </td>

                    {/* Absent Count */}
                    <td className="py-2 px-2 text-center font-bold text-red-700 tabular-nums bg-red-50/20">
                      {summary.absent}
                    </td>

                    {/* Leave Count */}
                    <td className="py-2 px-2 text-center font-bold text-amber-700 tabular-nums bg-amber-50/20">
                      {summary.leave}
                    </td>

                    {/* Total School Days */}
                    <td className="py-2 px-2 text-center text-slate-700 tabular-nums">
                      {summary.schoolDays}
                    </td>

                    {/* Attendance Percentage */}
                    <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums font-sans">
                      {summary.percentage !== null ? `${summary.percentage}%` : '—'}
                    </td>

                    {/* Rating Badge */}
                    <td className="py-2 px-2.5 text-center font-sans">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${getRatingBadgeClasses(summary.rating)}`}>
                        {summary.rating}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
