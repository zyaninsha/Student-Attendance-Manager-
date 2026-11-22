-- ==============================================================================
-- MIGRATION 2: ATTENDANCE, AUDIT LOGGING, HOLIDAYS & TRIGGERS
-- File: /supabase/migrations/20261024000002_attendance_and_audit.sql
-- Description: Attendance records table with strict duplicate prevention,
-- automatic audit trigger, holiday schedules, and performance indexes.
-- ==============================================================================

-- 1. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('P', 'A', 'L', 'H')),
    remarks TEXT,
    marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- CRITICAL: Prevent duplicate attendance entry for the same student on the same date
    CONSTRAINT unique_student_daily_attendance UNIQUE (student_id, attendance_date)
);

-- 2. Attendance Audit Logs (Captures all corrections, updates, and reasons)
CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. School Holidays Table
CREATE TABLE IF NOT EXISTS public.school_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    academic_session_id UUID REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    is_academic_break BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_holiday_range CHECK (end_date >= start_date)
);

-- 4. In-App Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notify_low_attendance BOOLEAN NOT NULL DEFAULT true,
    notify_unsubmitted_daily BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (institution_id, user_id)
);

-- 5. Performance Indexes for 1,000+ Students & High Speed Aggregations
CREATE INDEX IF NOT EXISTS idx_students_institution ON public.students(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON public.students(class_id, section_id, status);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_lookup ON public.attendance_records(institution_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance_records(class_id, section_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_records(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_audit ON public.attendance_audit_logs(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_holidays_dates ON public.school_holidays(institution_id, start_date, end_date);

-- 6. Trigger to Update 'updated_at' Timestamp Automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_institutions_updated_at ON public.institutions;
CREATE TRIGGER set_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance_records;
CREATE TRIGGER set_attendance_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Trigger to Record Attendance Audit Log Automatically on Correction/Update
CREATE OR REPLACE FUNCTION public.process_attendance_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO public.attendance_audit_logs (
                institution_id,
                record_id,
                student_id,
                attendance_date,
                old_status,
                new_status,
                changed_by,
                reason
            ) VALUES (
                NEW.institution_id,
                NEW.id,
                NEW.student_id,
                NEW.attendance_date,
                OLD.status,
                NEW.status,
                NEW.marked_by,
                COALESCE(NEW.remarks, 'Attendance status updated')
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.attendance_audit_logs (
            institution_id,
            record_id,
            student_id,
            attendance_date,
            old_status,
            new_status,
            changed_by,
            reason
        ) VALUES (
            NEW.institution_id,
            NEW.id,
            NEW.student_id,
            NEW.attendance_date,
            NULL,
            NEW.status,
            NEW.marked_by,
            'Initial attendance submission'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS attendance_audit_trigger ON public.attendance_records;
CREATE TRIGGER attendance_audit_trigger
AFTER INSERT OR UPDATE ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.process_attendance_audit();
