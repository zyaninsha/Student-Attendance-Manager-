import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCheck,
  Save,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AttendanceRow } from './AttendanceRow';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Student, SchoolClass, SchoolSection } from '../../types/models';
import { AttendanceStatus } from '../../types/database.types';
import { getTodayDateString } from '../../lib/dateUtils';

interface StudentAttendanceDraft {
  student: Student;
  status: AttendanceStatus | null;
  remarks: string;
}

export const DailyAttendanceView: React.FC = () => {
  const { user, role, isDemoMode } = useAuth();
  const isAdmin = role === 'admin';

  const [date, setDate] = useState<string>(getTodayDateString());
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [drafts, setDrafts] = useState<StudentAttendanceDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHolidayDate, setIsHolidayDate] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');

  // 1. Load Classes and Sections
  useEffect(() => {
    const loadClassHierarchy = async () => {
      if (!isSupabaseConfigured || isDemoMode) {
        // Starter Classes for Greenwood Academy
        const demoClasses: SchoolClass[] = [
          { id: 'c-g5', institution_id: 'demo', name: 'Grade 5', numeric_order: 5 },
          { id: 'c-g6', institution_id: 'demo', name: 'Grade 6', numeric_order: 6 },
          { id: 'c-g10', institution_id: 'demo', name: 'Grade 10', numeric_order: 10 },
        ];
        const demoSections: SchoolSection[] = [
          { id: 'sec-g5-a', institution_id: 'demo', class_id: 'c-g5', name: 'Section A' },
          { id: 'sec-g5-b', institution_id: 'demo', class_id: 'c-g5', name: 'Section B' },
          { id: 'sec-g6-a', institution_id: 'demo', class_id: 'c-g6', name: 'Section A' },
          { id: 'sec-g10-a', institution_id: 'demo', class_id: 'c-g10', name: 'Section A' },
        ];
        setClasses(demoClasses);
        setSections(demoSections);
        setSelectedClassId('c-g5');
        setSelectedSectionId('sec-g5-a');
        return;
      }

      try {
        const { data: clsData } = await supabase.from('classes').select('*').order('numeric_order');
        const { data: secData } = await supabase.from('sections').select('*').order('name');
        if (clsData) setClasses(clsData);
        if (secData) {
          setSections(secData);
          if (clsData && clsData.length > 0) {
            setSelectedClassId(clsData[0].id);
            const firstSec = secData.find((s: any) => s.class_id === clsData[0].id);
            if (firstSec) setSelectedSectionId(firstSec.id);
          }
        }
      } catch (err) {
        console.error('Error loading classes:', err);
      }
    };

    loadClassHierarchy();
  }, [isDemoMode]);

  // Filter sections when class changes
  const availableSections = sections.filter((s) => s.class_id === selectedClassId);

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(availableSections[0].id);
    }
  }, [selectedClassId, availableSections]);

  // 2. Fetch Students & Existing Attendance for Class/Section/Date
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId) return;

    const fetchRosterAndAttendance = async () => {
      setIsLoading(true);
      setSaveSuccess(false);

      if (!isSupabaseConfigured || isDemoMode) {
        // High fidelity starter student roster
        const names = [
          { name: 'Ava Robinson', roll: '01' },
          { name: 'Benjamin Hayes', roll: '02' },
          { name: 'Charlotte Chen', roll: '03' },
          { name: 'Daniel Miller', roll: '04' },
          { name: 'Emma Wilson', roll: '05' },
          { name: 'Finn O’Connor', roll: '06' },
          { name: 'Grace Patel', roll: '07' },
          { name: 'Henry Brooks', roll: '08' },
          { name: 'Isabella Diaz', roll: '09' },
          { name: 'Jack Thompson', roll: '10' },
        ];

        const starterDrafts: StudentAttendanceDraft[] = names.map((item, index) => ({
          student: {
            id: `stu-${index + 1}`,
            institution_id: 'demo',
            student_id: `STU-2026-00${String(index + 1).padStart(2, '0')}`,
            full_name: item.name,
            roll_number: item.roll,
            class_id: selectedClassId,
            section_id: selectedSectionId,
            admission_date: '2026-08-15',
            status: 'active',
          },
          status: index === 3 ? 'A' : index === 6 ? 'L' : 'P', // prefilled sample
          remarks: index === 3 ? 'Informed by guardian' : '',
        }));

        setDrafts(starterDrafts);
        setIsLoading(false);
        return;
      }

      try {
        // Check for holidays on this date
        const { data: holidays } = await supabase
          .from('school_holidays')
          .select('*')
          .lte('start_date', date)
          .gte('end_date', date);

        if (holidays && holidays.length > 0) {
          setIsHolidayDate(true);
          setHolidayTitle(holidays[0].title);
        } else {
          setIsHolidayDate(false);
          setHolidayTitle('');
        }

        // Fetch students
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', selectedClassId)
          .eq('section_id', selectedSectionId)
          .eq('status', 'active')
          .order('roll_number');

        // Fetch attendance records for this date
        const { data: existingRecords } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('class_id', selectedClassId)
          .eq('section_id', selectedSectionId)
          .eq('attendance_date', date);

        const recordMap = new Map<string, { status: AttendanceStatus; remarks: string }>();
        if (existingRecords) {
          existingRecords.forEach((r: any) => {
            recordMap.set(r.student_id, {
              status: r.status as AttendanceStatus,
              remarks: r.remarks || '',
            });
          });
        }

        if (studentsData) {
          const loadedDrafts: StudentAttendanceDraft[] = studentsData.map((s: any) => {
            const existing = recordMap.get(s.id);
            return {
              student: s as Student,
              status: existing ? existing.status : null,
              remarks: existing ? existing.remarks : '',
            };
          });
          setDrafts(loadedDrafts);
        }
      } catch (err) {
        console.error('Error loading daily attendance roster:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRosterAndAttendance();
  }, [selectedClassId, selectedSectionId, date, isDemoMode]);

  // Status Handlers
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.student.id === studentId ? { ...d, status: newStatus } : d
      )
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.student.id === studentId ? { ...d, remarks } : d
      )
    );
  };

  const markAllPresent = () => {
    setDrafts((prev) =>
      prev.map((d) => ({
        ...d,
        status: 'P',
      }))
    );
  };

  // Counters
  const totalCount = drafts.length;
  const presentCount = drafts.filter((d) => d.status === 'P').length;
  const absentCount = drafts.filter((d) => d.status === 'A').length;
  const leaveCount = drafts.filter((d) => d.status === 'L').length;
  const holidayCount = drafts.filter((d) => d.status === 'H').length;
  const unmarkedCount = drafts.filter((d) => d.status === null).length;

  const handleSaveConfirmed = async () => {
    setIsSaving(true);
    setIsConfirmOpen(false);

    if (!isSupabaseConfigured || isDemoMode) {
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
      }, 400);
      return;
    }

    try {
      // Get current active session
      const { data: sessionData } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      const sessionId = sessionData?.id;

      // Filter only drafts that have been marked
      const markedDrafts = drafts.filter((d) => d.status !== null);

      for (const d of markedDrafts) {
        // Safe concurrent upsert matching unique constraint (student_id, attendance_date)
        await supabase.from('attendance_records').upsert(
          {
            institution_id: user!.institution_id,
            student_id: d.student.id,
            class_id: selectedClassId,
            section_id: selectedSectionId,
            academic_session_id: sessionId || '00000000-0000-0000-0000-000000000000',
            attendance_date: date,
            status: d.status!,
            remarks: d.remarks || null,
            marked_by: user?.id || null,
          },
          {
            onConflict: 'student_id,attendance_date',
          }
        );
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving attendance records:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Selection Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div>
            <label htmlFor="att-date" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Date
            </label>
            <div className="relative">
              <input
                id="att-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs font-mono py-2 pl-8 pr-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Class Dropdown */}
          <div>
            <label htmlFor="att-class" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              id="att-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[130px]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Dropdown */}
          <div>
            <label htmlFor="att-section" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              id="att-section"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px]"
            >
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 self-end md:self-end">
          <button
            type="button"
            onClick={markAllPresent}
            disabled={isLoading || isHolidayDate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isLoading || drafts.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Attendance</span>
          </button>
        </div>
      </div>

      {/* Holiday Notification Banner */}
      {isHolidayDate && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-3 text-xs text-sky-800">
          <Lock className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>Official School Holiday:</strong> {holidayTitle}. Regular attendance marking is blocked unless specifically authorized by the administration.
          </span>
        </div>
      )}

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Attendance successfully recorded!</strong> Audit logs have been updated in the cloud database.
          </span>
        </div>
      )}

      {/* Real-time Summary Count Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
          <p className="text-[10px] uppercase font-semibold text-slate-500">Total Enrolled</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{totalCount}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 text-center">
          <p className="text-[10px] uppercase font-semibold text-emerald-700">Present (P)</p>
          <p className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">{presentCount}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-red-200 bg-red-50/30 text-center">
          <p className="text-[10px] uppercase font-semibold text-red-700">Absent (A)</p>
          <p className="text-xl font-bold text-red-700 tabular-nums mt-0.5">{absentCount}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-amber-200 bg-amber-50/30 text-center">
          <p className="text-[10px] uppercase font-semibold text-amber-700">On Leave (L)</p>
          <p className="text-xl font-bold text-amber-700 tabular-nums mt-0.5">{leaveCount}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-semibold text-slate-500">Unmarked (—)</p>
          <p className={`text-xl font-bold tabular-nums mt-0.5 ${unmarkedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {unmarkedCount}
          </p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {drafts.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No Students Found"
            description="There are currently no active students registered in this class section."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 sm:px-4 font-semibold w-16">Roll</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold w-28 hidden sm:table-cell">Student ID</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold w-48 text-center sm:text-left">Attendance Status</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drafts.map((d) => (
                  <AttendanceRow
                    key={d.student.id}
                    student={d.student}
                    status={d.status}
                    remarks={d.remarks}
                    isLocked={isHolidayDate}
                    onStatusChange={(newStatus) => handleStatusChange(d.student.id, newStatus)}
                    onRemarksChange={(newRemarks) => handleRemarksChange(d.student.id, newRemarks)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Confirmation Dialog */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Confirm Attendance Submission"
        message={
          unmarkedCount > 0
            ? `You have ${unmarkedCount} unmarked student(s). Unmarked students will remain unrecorded and will NOT be automatically marked Absent. Would you like to proceed and submit ${presentCount} Present, ${absentCount} Absent, and ${leaveCount} Leave records for ${date}?`
            : `Are you ready to submit attendance for ${date}? This will record ${presentCount} Present, ${absentCount} Absent, and ${leaveCount} Leave entries.`
        }
        confirmLabel="Confirm & Save"
        variant={unmarkedCount > 0 ? 'warning' : 'primary'}
        isLoading={isSaving}
        onConfirm={handleSaveConfirmed}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
