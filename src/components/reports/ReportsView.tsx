import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { AttendanceBadge } from '../common/AttendanceBadge';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Student, SchoolClass, SchoolSection, AttendanceRecord } from '../../types/models';
import { AttendanceStatus } from '../../types/database.types';
import { exportToCSV, exportToXLSX, triggerPrint } from '../../lib/exportUtils';
import { getTodayDateString } from '../../lib/dateUtils';
import { calculateStudentSummary, getRatingBadgeClasses } from '../../lib/calculations';

type ReportType = 'daily' | 'low-attendance' | 'student-history' | 'session-summary';

export const ReportsView: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('daily');

  // Filter States
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedSectionId, setSelectedSectionId] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load Classes & Sections
  useEffect(() => {
    const loadFilters = async () => {
      if (!isSupabaseConfigured || isDemoMode) {
        setClasses([
          { id: 'c-g5', institution_id: 'demo', name: 'Grade 5', numeric_order: 5 },
          { id: 'c-g6', institution_id: 'demo', name: 'Grade 6', numeric_order: 6 },
        ]);
        setSections([
          { id: 'sec-g5-a', institution_id: 'demo', class_id: 'c-g5', name: 'Section A' },
          { id: 'sec-g5-b', institution_id: 'demo', class_id: 'c-g5', name: 'Section B' },
        ]);
        return;
      }
      try {
        const { data: c } = await supabase.from('classes').select('*').order('numeric_order');
        const { data: s } = await supabase.from('sections').select('*').order('name');
        if (c) setClasses(c);
        if (s) setSections(s);
      } catch (err) {
        console.error(err);
      }
    };
    loadFilters();
  }, [isDemoMode]);

  // Load Students & Attendance
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);

      if (!isSupabaseConfigured || isDemoMode) {
        const demoRoster: Student[] = [
          { id: 's1', institution_id: 'demo', student_id: 'STU-001', roll_number: '01', full_name: 'Ava Robinson', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', guardian_phone: '+1 555-1234', status: 'active' },
          { id: 's2', institution_id: 'demo', student_id: 'STU-002', roll_number: '02', full_name: 'Benjamin Hayes', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', guardian_phone: '+1 555-2345', status: 'active' },
          { id: 's3', institution_id: 'demo', student_id: 'STU-003', roll_number: '03', full_name: 'Charlotte Chen', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', guardian_phone: '+1 555-3456', status: 'active' },
          { id: 's4', institution_id: 'demo', student_id: 'STU-004', roll_number: '04', full_name: 'Daniel Miller', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', guardian_phone: '+1 555-4567', status: 'active' },
          { id: 's5', institution_id: 'demo', student_id: 'STU-005', roll_number: '05', full_name: 'Emma Wilson', class_id: 'c-g5', section_id: 'sec-g5-b', class_name: 'Grade 5', section_name: 'Section B', admission_date: '2026-08-01', guardian_phone: '+1 555-5678', status: 'active' },
        ];
        setStudents(demoRoster);
        if (demoRoster.length > 0 && !selectedStudentId) {
          setSelectedStudentId(demoRoster[0].id);
        }

        const demoRecords: AttendanceRecord[] = [
          { id: 'rec-1', institution_id: 'demo', student_id: 's1', class_id: 'c-g5', section_id: 'sec-g5-a', academic_session_id: 'sess', attendance_date: startDate, status: 'P', remarks: '' },
          { id: 'rec-2', institution_id: 'demo', student_id: 's2', class_id: 'c-g5', section_id: 'sec-g5-a', academic_session_id: 'sess', attendance_date: startDate, status: 'P', remarks: '' },
          { id: 'rec-3', institution_id: 'demo', student_id: 's3', class_id: 'c-g5', section_id: 'sec-g5-a', academic_session_id: 'sess', attendance_date: startDate, status: 'P', remarks: '' },
          { id: 'rec-4', institution_id: 'demo', student_id: 's4', class_id: 'c-g5', section_id: 'sec-g5-a', academic_session_id: 'sess', attendance_date: startDate, status: 'A', remarks: 'Unexcused' },
          { id: 'rec-5', institution_id: 'demo', student_id: 's5', class_id: 'c-g5', section_id: 'sec-g5-b', academic_session_id: 'sess', attendance_date: startDate, status: 'L', remarks: 'Sick leave' },
        ];
        setRecords(demoRecords);
        setIsLoading(false);
        return;
      }

      try {
        const { data: stus } = await supabase.from('students').select('*, class:classes(name), section:sections(name)').order('roll_number');
        if (stus) {
          const mapped: Student[] = stus.map((d: any) => ({
            ...d,
            class_name: d.class?.name,
            section_name: d.section?.name,
          }));
          setStudents(mapped);
          if (mapped.length > 0 && !selectedStudentId) setSelectedStudentId(mapped[0].id);
        }

        let q = supabase
          .from('attendance_records')
          .select('*, student:students(full_name, roll_number, student_id)')
          .gte('attendance_date', startDate)
          .lte('attendance_date', endDate);

        if (selectedClassId !== 'all') q = q.eq('class_id', selectedClassId);
        if (selectedSectionId !== 'all') q = q.eq('section_id', selectedSectionId);

        const { data: recs } = await q;
        if (recs) setRecords(recs as any);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [startDate, endDate, selectedClassId, selectedSectionId, isDemoMode]);

  // Aggregate summaries by student for session / low attendance
  const studentSummaries = useMemo(() => {
    return students.map((student) => {
      const studentRecords = records.filter((r) => r.student_id === student.id);
      const statuses = studentRecords.map((r) => r.status);
      return calculateStudentSummary(student, statuses);
    });
  }, [students, records]);

  // Reports data filter
  const displayedSummaries = useMemo(() => {
    if (reportType === 'low-attendance') {
      return studentSummaries.filter((s) => s.rating === 'Low' || (s.percentage !== null && s.percentage < 75));
    }
    return studentSummaries;
  }, [studentSummaries, reportType]);

  // Individual student records for History report
  const selectedStudentHistory = useMemo(() => {
    return records
      .filter((r) => r.student_id === selectedStudentId)
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  }, [records, selectedStudentId]);

  // Export CSV
  const handleExportCSV = () => {
    if (reportType === 'student-history') {
      const stu = students.find((s) => s.id === selectedStudentId);
      const headers = ['Date', 'Status', 'Remarks'];
      const rows = selectedStudentHistory.map((r) => [r.attendance_date, r.status, r.remarks || '']);
      exportToCSV(`${stu?.full_name || 'Student'}_Attendance_History`, headers, rows);
    } else {
      const headers = ['Roll', 'ID', 'Name', 'Class', 'Present', 'Absent', 'Leave', 'School Days', 'Percentage', 'Rating'];
      const rows = displayedSummaries.map((s) => [
        s.student.roll_number,
        s.student.student_id,
        s.student.full_name,
        s.student.class_name || '',
        s.present,
        s.absent,
        s.leave,
        s.schoolDays,
        s.percentage !== null ? `${s.percentage}%` : 'Not Started',
        s.rating,
      ]);
      exportToCSV(`Report_${reportType}_${startDate}_${endDate}`, headers, rows);
    }
  };

  // Export XLSX
  const handleExportXLSX = () => {
    const headers = ['Roll', 'ID', 'Name', 'Class', 'Present', 'Absent', 'Leave', 'School Days', 'Percentage', 'Rating'];
    const rows = displayedSummaries.map((s) => [
      s.student.roll_number,
      s.student.student_id,
      s.student.full_name,
      s.student.class_name || '',
      s.present,
      s.absent,
      s.leave,
      s.schoolDays,
      s.percentage !== null ? `${s.percentage}%` : 'Not Started',
      s.rating,
    ]);
    exportToXLSX(`Attendance_Report_${reportType}`, 'Report', headers, rows);
  };

  return (
    <div className="space-y-6 print-container">
      {/* Top Report Type Bar (Hidden in Print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap gap-1 no-print">
        {[
          { id: 'daily', label: 'Daily Attendance Report' },
          { id: 'low-attendance', label: 'Low Attendance (<75%)' },
          { id: 'session-summary', label: 'Academic Term Summary' },
          { id: 'student-history', label: 'Individual Student History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as ReportType)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              reportType === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Parameters Bar (Hidden in Print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white font-mono"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white font-mono"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Individual Student Picker if in History Mode */}
          {reportType === 'student-history' && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-blue-900"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll_number} - {s.full_name} ({s.student_id})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-4 text-center border-b pb-2">
        <h1 className="text-xl font-bold uppercase tracking-wider text-black">
          Official School Attendance Report
        </h1>
        <p className="text-xs text-gray-700">
          Period: {startDate} to {endDate} · Generated: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {reportType === 'student-history' ? (
          /* Individual Student Log */
          <div className="overflow-x-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {students.find((s) => s.id === selectedStudentId)?.full_name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {students.find((s) => s.id === selectedStudentId)?.student_id} · Roll: {students.find((s) => s.id === selectedStudentId)?.roll_number}
                </p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Remarks / Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedStudentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No attendance records found for this student in the chosen date range.
                    </td>
                  </tr>
                ) : (
                  selectedStudentHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-medium">{rec.attendance_date}</td>
                      <td className="py-2.5 px-4">
                        <AttendanceBadge status={rec.status} size="sm" showLabel />
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{rec.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Aggregated Summary Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4 w-14">Roll</th>
                  <th className="py-3 px-3 sm:px-4 w-28 font-mono">Student ID</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Student Name</th>
                  <th className="py-3 px-3 sm:px-4">Class</th>
                  <th className="py-3 px-3 sm:px-4 text-center text-emerald-800">Present (P)</th>
                  <th className="py-3 px-3 sm:px-4 text-center text-red-800">Absent (A)</th>
                  <th className="py-3 px-3 sm:px-4 text-center text-amber-800">Leave (L)</th>
                  <th className="py-3 px-3 sm:px-4 text-center">School Days</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Attendance %</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      No student records matched the criteria.
                    </td>
                  </tr>
                ) : (
                  displayedSummaries.map((s) => (
                    <tr key={s.student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-slate-700 tabular-nums">
                        {s.student.roll_number}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 font-mono text-slate-500">
                        {s.student.student_id}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">
                        {s.student.full_name}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-600">
                        {s.student.class_name} {s.student.section_name && `· ${s.student.section_name}`}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center font-bold text-emerald-700 tabular-nums">
                        {s.present}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center font-bold text-red-700 tabular-nums">
                        {s.absent}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center font-bold text-amber-700 tabular-nums">
                        {s.leave}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center text-slate-700 tabular-nums">
                        {s.schoolDays}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-right font-bold text-slate-900 tabular-nums">
                        {s.percentage !== null ? `${s.percentage}%` : 'Not Started'}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] border ${getRatingBadgeClasses(s.rating)}`}>
                          {s.rating}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
