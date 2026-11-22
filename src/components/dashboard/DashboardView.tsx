import React, { useState, useEffect } from 'react';
import { Calendar, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { MetricSummaryCards } from './MetricSummaryCards';
import { AttendanceCharts, DailyTrendPoint, ClassComparisonPoint } from './AttendanceCharts';
import { LowAttendanceTable } from './LowAttendanceTable';
import { RecentActivityFeed } from './RecentActivityFeed';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { StudentAttendanceSummary, AttendanceAuditLog } from '../../types/models';
import { getTodayDateString } from '../../lib/dateUtils';
import { calculateStudentSummary } from '../../lib/calculations';

export const DashboardView: React.FC = () => {
  const { user, role, institution, isDemoMode } = useAuth();
  const isAdmin = role === 'admin';

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [classList, setClassList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Aggregated Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    presentToday: 0,
    absentToday: 0,
    leaveToday: 0,
    unmarkedToday: 0,
    overallPercentage: null as number | null,
    lowAttendanceCount: 0,
  });

  const [trendData, setTrendData] = useState<DailyTrendPoint[]>([]);
  const [classData, setClassData] = useState<ClassComparisonPoint[]>([]);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<StudentAttendanceSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AttendanceAuditLog[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);

    if (!isSupabaseConfigured || isDemoMode) {
      // High-fidelity starter dataset for Greenwood Academy
      const starterClasses = [
        { id: 'c-g5', name: 'Grade 5' },
        { id: 'c-g6', name: 'Grade 6' },
        { id: 'c-g10', name: 'Grade 10' },
      ];
      setClassList(starterClasses);

      setStats({
        totalStudents: 142,
        totalTeachers: 12,
        totalClasses: 6,
        presentToday: 128,
        absentToday: 9,
        leaveToday: 5,
        unmarkedToday: 0,
        overallPercentage: 92.4,
        lowAttendanceCount: 3,
      });

      setTrendData([
        { dateLabel: 'Mon', present: 132, absent: 6, leave: 4, percentage: 93.0 },
        { dateLabel: 'Tue', present: 130, absent: 8, leave: 4, percentage: 91.5 },
        { dateLabel: 'Wed', present: 135, absent: 5, leave: 2, percentage: 95.1 },
        { dateLabel: 'Thu', present: 129, absent: 9, leave: 4, percentage: 90.9 },
        { dateLabel: 'Fri', present: 133, absent: 7, leave: 2, percentage: 93.7 },
        { dateLabel: 'Today', present: 128, absent: 9, leave: 5, percentage: 90.1 },
      ]);

      setClassData([
        { className: 'Grade 5 - Section A', totalStudents: 32, attendanceRate: 94.8 },
        { className: 'Grade 5 - Section B', totalStudents: 30, attendanceRate: 91.2 },
        { className: 'Grade 6 - Section A', totalStudents: 38, attendanceRate: 88.5 },
        { className: 'Grade 10 - Section A', totalStudents: 42, attendanceRate: 93.4 },
      ]);

      setLowAttendanceStudents([
        {
          student: {
            id: 'demo-s1',
            institution_id: 'demo-inst',
            student_id: 'STU-2026-0042',
            full_name: 'Liam Alexander',
            roll_number: '14',
            class_id: 'c-g6',
            section_id: 'sec-a',
            class_name: 'Grade 6',
            section_name: 'Section A',
            admission_date: '2026-08-15',
            guardian_name: 'Marcus Alexander',
            guardian_phone: '+1 (555) 349-2041',
            status: 'active',
          },
          present: 24,
          absent: 10,
          leave: 2,
          holiday: 4,
          unmarked: 0,
          schoolDays: 36,
          percentage: 66.7,
          rating: 'Low',
        },
        {
          student: {
            id: 'demo-s2',
            institution_id: 'demo-inst',
            student_id: 'STU-2026-0089',
            full_name: 'Sophia Martinez',
            roll_number: '22',
            class_id: 'c-g5',
            section_id: 'sec-b',
            class_name: 'Grade 5',
            section_name: 'Section B',
            admission_date: '2026-08-15',
            guardian_name: 'Elena Martinez',
            guardian_phone: '+1 (555) 782-9011',
            status: 'active',
          },
          present: 26,
          absent: 9,
          leave: 1,
          holiday: 4,
          unmarked: 0,
          schoolDays: 36,
          percentage: 72.2,
          rating: 'Low',
        },
      ]);

      setAuditLogs([
        {
          id: 'log-1',
          institution_id: 'demo-inst',
          student_id: 'demo-s1',
          student_name: 'Liam Alexander',
          attendance_date: selectedDate,
          old_status: 'P',
          new_status: 'A',
          reason: 'Correction: Left school at 9:15 AM due to fever',
          created_at: new Date().toISOString(),
        },
        {
          id: 'log-2',
          institution_id: 'demo-inst',
          student_id: 'demo-s2',
          student_name: 'Sophia Martinez',
          attendance_date: selectedDate,
          old_status: null,
          new_status: 'L',
          reason: 'Doctor note provided for orthodontic appointment',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);

      setIsLoading(false);
      return;
    }

    try {
      // Real database fetch via Supabase
      const instId = user?.institution_id;

      // 1. Fetch classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .order('numeric_order');
      if (classes) setClassList(classes);

      // 2. Fetch active students count
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 3. Fetch teachers count
      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 4. Fetch attendance records for selected date
      let query = supabase
        .from('attendance_records')
        .select('status, class_id')
        .eq('attendance_date', selectedDate);

      if (selectedClassId !== 'all') {
        query = query.eq('class_id', selectedClassId);
      }

      const { data: records } = await query;

      let p = 0;
      let a = 0;
      let l = 0;
      if (records) {
        records.forEach((r: any) => {
          if (r.status === 'P') p++;
          else if (r.status === 'A') a++;
          else if (r.status === 'L') l++;
        });
      }

      const totalMarked = p + a + l;
      const totalStuds = studentCount || 0;
      const unmarked = Math.max(0, totalStuds - totalMarked);
      const overallPct = totalMarked > 0 ? Math.round((p / totalMarked) * 1000) / 10 : null;

      setStats({
        totalStudents: totalStuds,
        totalTeachers: teacherCount || 0,
        totalClasses: classes?.length || 0,
        presentToday: p,
        absentToday: a,
        leaveToday: l,
        unmarkedToday: unmarked,
        overallPercentage: overallPct,
        lowAttendanceCount: 0,
      });

      // 5. Fetch recent audit logs
      const { data: logs } = await supabase
        .from('attendance_audit_logs')
        .select('*, student:students(full_name, roll_number)')
        .order('created_at', { ascending: false })
        .limit(8);

      if (logs) {
        const mappedLogs: AttendanceAuditLog[] = logs.map((lg: any) => ({
          id: lg.id,
          institution_id: lg.institution_id,
          student_id: lg.student_id,
          student_name: lg.student?.full_name,
          roll_number: lg.student?.roll_number,
          attendance_date: lg.attendance_date,
          old_status: lg.old_status,
          new_status: lg.new_status,
          reason: lg.reason,
          created_at: lg.created_at,
        }));
        setAuditLogs(mappedLogs);
      }
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, selectedClassId, isDemoMode]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label htmlFor="dash-date" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Date:</span>
            </label>
            <input
              id="dash-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-mono py-1.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="dash-class" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Scope:</span>
            </label>
            <select
              id="dash-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All School Classes</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Live</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <MetricSummaryCards
        totalStudents={stats.totalStudents}
        totalTeachers={stats.totalTeachers}
        totalClasses={stats.totalClasses}
        presentToday={stats.presentToday}
        absentToday={stats.absentToday}
        leaveToday={stats.leaveToday}
        unmarkedToday={stats.unmarkedToday}
        overallPercentage={stats.overallPercentage}
        lowAttendanceCount={stats.lowAttendanceCount}
        isAdmin={isAdmin}
      />

      {/* Charts Section */}
      <AttendanceCharts trendData={trendData} classData={classData} />

      {/* Bottom Grids: Low Attendance Table & Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LowAttendanceTable students={lowAttendanceStudents} />
        </div>
        <div>
          <RecentActivityFeed logs={auditLogs} />
        </div>
      </div>
    </div>
  );
};
