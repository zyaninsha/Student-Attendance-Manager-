import { AttendanceStatus, UserRole, EntityStatus } from './database.types';

export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  good_threshold: number;
  warning_threshold: number;
  working_days: string[];
}

export interface UserProfile {
  id: string;
  institution_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  institution?: Institution;
}

export interface AcademicSession {
  id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface SchoolClass {
  id: string;
  institution_id: string;
  name: string;
  numeric_order: number;
  sections?: SchoolSection[];
}

export interface SchoolSection {
  id: string;
  institution_id: string;
  class_id: string;
  name: string;
  class_name?: string;
}

export interface Teacher {
  id: string;
  institution_id: string;
  profile_id?: string | null;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  designation: string;
  status: EntityStatus;
  assignments?: TeacherClassAssignment[];
}

export interface TeacherClassAssignment {
  id: string;
  institution_id: string;
  teacher_id: string;
  class_id: string;
  section_id: string;
  academic_session_id: string;
  class_name?: string;
  section_name?: string;
  teacher_name?: string;
}

export interface Student {
  id: string;
  institution_id: string;
  student_id: string;
  full_name: string;
  roll_number: string;
  class_id: string;
  section_id: string;
  class_name?: string;
  section_name?: string;
  admission_date: string;
  dob?: string | null;
  gender?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
  address?: string | null;
  status: EntityStatus;
}

export interface AttendanceRecord {
  id: string;
  institution_id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  academic_session_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  remarks?: string | null;
  marked_by?: string | null;
  created_at?: string;
  updated_at?: string;
  student?: Student;
}

export interface AttendanceAuditLog {
  id: string;
  institution_id: string;
  record_id?: string | null;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  attendance_date: string;
  old_status?: string | null;
  new_status: string;
  changed_by?: string | null;
  changer_name?: string;
  reason?: string | null;
  created_at: string;
}

export interface SchoolHoliday {
  id: string;
  institution_id: string;
  academic_session_id?: string | null;
  title: string;
  start_date: string;
  end_date: string;
  description?: string | null;
  is_academic_break: boolean;
}

export interface StudentAttendanceSummary {
  student: Student;
  present: number;
  absent: number;
  leave: number;
  holiday: number;
  unmarked: number;
  schoolDays: number;
  percentage: number | null; // null if schoolDays == 0 ("Not Started")
  rating: 'Good' | 'Warning' | 'Low' | 'Not Started';
}

export interface DailyRegisterStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  holidayCount: number;
  unmarkedCount: number;
  attendancePercentage: number | null;
}

export type NavItem =
  | 'dashboard'
  | 'daily-attendance'
  | 'monthly-register'
  | 'students'
  | 'classes'
  | 'teachers'
  | 'reports'
  | 'calendar'
  | 'notifications'
  | 'settings';
