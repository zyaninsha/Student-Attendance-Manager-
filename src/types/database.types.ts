/**
 * Database schema TypeScript definitions matching Supabase PostgreSQL tables.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AttendanceStatus = 'P' | 'A' | 'L' | 'H';
export type UserRole = 'admin' | 'teacher';
export type EntityStatus = 'active' | 'inactive';

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          good_threshold: number;
          warning_threshold: number;
          working_days: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['institutions']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          institution_id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          institution_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
      };
      academic_sessions: {
        Row: {
          id: string;
          institution_id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['academic_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['academic_sessions']['Insert']>;
      };
      classes: {
        Row: {
          id: string;
          institution_id: string;
          name: string;
          numeric_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
      };
      sections: {
        Row: {
          id: string;
          institution_id: string;
          class_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sections']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sections']['Insert']>;
      };
      teachers: {
        Row: {
          id: string;
          institution_id: string;
          profile_id: string | null;
          employee_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          designation: string;
          status: EntityStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teachers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['teachers']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          institution_id: string;
          student_id: string;
          full_name: string;
          roll_number: string;
          class_id: string;
          section_id: string;
          admission_date: string;
          dob: string | null;
          gender: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          guardian_email: string | null;
          address: string | null;
          status: EntityStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
      };
      teacher_class_assignments: {
        Row: {
          id: string;
          institution_id: string;
          teacher_id: string;
          class_id: string;
          section_id: string;
          academic_session_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teacher_class_assignments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['teacher_class_assignments']['Insert']>;
      };
      attendance_records: {
        Row: {
          id: string;
          institution_id: string;
          student_id: string;
          class_id: string;
          section_id: string;
          academic_session_id: string;
          attendance_date: string;
          status: AttendanceStatus;
          remarks: string | null;
          marked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };
      attendance_audit_logs: {
        Row: {
          id: string;
          institution_id: string;
          record_id: string | null;
          student_id: string;
          attendance_date: string;
          old_status: string | null;
          new_status: string;
          changed_by: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['attendance_audit_logs']['Insert']>;
      };
      school_holidays: {
        Row: {
          id: string;
          institution_id: string;
          academic_session_id: string | null;
          title: string;
          start_date: string;
          end_date: string;
          description: string | null;
          is_academic_break: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['school_holidays']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['school_holidays']['Insert']>;
      };
      notification_preferences: {
        Row: {
          id: string;
          institution_id: string;
          user_id: string;
          notify_low_attendance: boolean;
          notify_unsubmitted_daily: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notification_preferences']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>;
      };
    };
  };
}
