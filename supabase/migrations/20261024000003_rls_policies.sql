-- ==============================================================================
-- MIGRATION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- File: /supabase/migrations/20261024000003_rls_policies.sql
-- Description: Enforces multi-tenant institutional isolation and role boundaries.
-- Teachers can ONLY see and mark attendance for assigned classes.
-- ==============================================================================

-- 1. Enable Row Level Security on ALL public tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Security Helper Functions (SECURITY DEFINER to prevent recursive query locks)

-- Get current authenticated user's institution ID
CREATE OR REPLACE FUNCTION public.get_auth_institution_id()
RETURNS UUID AS $$
    SELECT institution_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current authenticated teacher is assigned to a specific class and section
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_class(target_class_id UUID, target_section_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.teacher_class_assignments tca
        JOIN public.teachers t ON t.id = tca.teacher_id
        JOIN public.profiles p ON p.id = t.profile_id
        WHERE p.id = auth.uid()
          AND tca.class_id = target_class_id
          AND tca.section_id = target_section_id
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 3. POLICIES: institutions
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own institution" ON public.institutions;
CREATE POLICY "Users can view their own institution"
ON public.institutions FOR SELECT
USING (id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admins can update their institution" ON public.institutions;
CREATE POLICY "Admins can update their institution"
ON public.institutions FOR UPDATE
USING (id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (id = public.get_auth_institution_id() AND public.is_admin());

-- ==============================================================================
-- 4. POLICIES: profiles
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view profiles in same institution" ON public.profiles;
CREATE POLICY "Users can view profiles in same institution"
ON public.profiles FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- ==============================================================================
-- 5. POLICIES: user_roles (Admin only for modifications; users cannot self-promote)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view roles in their institution" ON public.user_roles;
CREATE POLICY "Users can view roles in their institution"
ON public.user_roles FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
USING (institution_id = public.get_auth_institution_id() AND public.is_admin());

-- ==============================================================================
-- 6. POLICIES: academic_sessions, classes, sections, school_holidays
-- ==============================================================================
DROP POLICY IF EXISTS "Read academic sessions" ON public.academic_sessions;
CREATE POLICY "Read academic sessions" ON public.academic_sessions FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admin modify academic sessions" ON public.academic_sessions;
CREATE POLICY "Admin modify academic sessions" ON public.academic_sessions FOR ALL
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

DROP POLICY IF EXISTS "Read classes" ON public.classes;
CREATE POLICY "Read classes" ON public.classes FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admin modify classes" ON public.classes;
CREATE POLICY "Admin modify classes" ON public.classes FOR ALL
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

DROP POLICY IF EXISTS "Read sections" ON public.sections;
CREATE POLICY "Read sections" ON public.sections FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admin modify sections" ON public.sections;
CREATE POLICY "Admin modify sections" ON public.sections FOR ALL
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

DROP POLICY IF EXISTS "Read holidays" ON public.school_holidays;
CREATE POLICY "Read holidays" ON public.school_holidays FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admin modify holidays" ON public.school_holidays;
CREATE POLICY "Admin modify holidays" ON public.school_holidays FOR ALL
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

-- ==============================================================================
-- 7. POLICIES: teachers & teacher_class_assignments
-- ==============================================================================
DROP POLICY IF EXISTS "Read teachers" ON public.teachers;
CREATE POLICY "Read teachers" ON public.teachers FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admin modify teachers" ON public.teachers;
CREATE POLICY "Admin modify teachers" ON public.teachers FOR ALL
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

DROP POLICY IF EXISTS "Read assignments" ON public.teacher_class_assignments;
CREATE POLICY "Read assignments" ON public.teacher_class_assignments FOR SELECT
USING (institution_id = public.get_auth_institution_id());

DROP POLICY IF EXISTS "Admin modify assignments" ON public.teacher_class_assignments;
CREATE POLICY "Admin modify assignments" ON public.teacher_class_assignments FOR ALL
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

-- ==============================================================================
-- 8. POLICIES: students
-- ==============================================================================
DROP POLICY IF EXISTS "Read students" ON public.students;
CREATE POLICY "Read students" ON public.students FOR SELECT
USING (
    institution_id = public.get_auth_institution_id()
    AND (
        public.is_admin()
        OR public.is_teacher_assigned_to_class(class_id, section_id)
    )
);

DROP POLICY IF EXISTS "Admin modify students" ON public.students;
CREATE POLICY "Admin modify students" ON public.students FOR ALL
USING (institution_id = public.get_auth_institution_id() AND public.is_admin())
WITH CHECK (institution_id = public.get_auth_institution_id() AND public.is_admin());

-- ==============================================================================
-- 9. POLICIES: attendance_records (Core security boundary)
-- ==============================================================================
DROP POLICY IF EXISTS "Read attendance records" ON public.attendance_records;
CREATE POLICY "Read attendance records" ON public.attendance_records FOR SELECT
USING (
    institution_id = public.get_auth_institution_id()
    AND (
        public.is_admin()
        OR public.is_teacher_assigned_to_class(class_id, section_id)
    )
);

DROP POLICY IF EXISTS "Insert attendance records" ON public.attendance_records;
CREATE POLICY "Insert attendance records" ON public.attendance_records FOR INSERT
WITH CHECK (
    institution_id = public.get_auth_institution_id()
    AND (
        public.is_admin()
        OR public.is_teacher_assigned_to_class(class_id, section_id)
    )
);

DROP POLICY IF EXISTS "Update attendance records" ON public.attendance_records;
CREATE POLICY "Update attendance records" ON public.attendance_records FOR UPDATE
USING (
    institution_id = public.get_auth_institution_id()
    AND (
        public.is_admin()
        OR public.is_teacher_assigned_to_class(class_id, section_id)
    )
)
WITH CHECK (
    institution_id = public.get_auth_institution_id()
    AND (
        public.is_admin()
        OR public.is_teacher_assigned_to_class(class_id, section_id)
    )
);

DROP POLICY IF EXISTS "Delete attendance records" ON public.attendance_records;
CREATE POLICY "Delete attendance records" ON public.attendance_records FOR DELETE
USING (institution_id = public.get_auth_institution_id() AND public.is_admin());

-- ==============================================================================
-- 10. POLICIES: attendance_audit_logs
-- ==============================================================================
DROP POLICY IF EXISTS "Read audit logs" ON public.attendance_audit_logs;
CREATE POLICY "Read audit logs" ON public.attendance_audit_logs FOR SELECT
USING (institution_id = public.get_auth_institution_id());

-- ==============================================================================
-- 11. POLICIES: notification_preferences
-- ==============================================================================
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
