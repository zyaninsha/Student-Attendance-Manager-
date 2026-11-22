-- ==============================================================================
-- MIGRATION 4: SECURE FIRST ADMIN BOOTSTRAP & SEED HELPER
-- File: /supabase/migrations/20261024000004_bootstrap_admin.sql
-- Description: Creates the default school, starter academic session,
-- classes, and a secure helper function to promote your user to Admin.
-- ==============================================================================

-- 1. Create a helper function to bootstrap the first administrator
-- This function runs with SECURITY DEFINER privileges to link an auth user.
CREATE OR REPLACE FUNCTION public.bootstrap_admin_account(
    admin_email TEXT,
    admin_full_name TEXT DEFAULT 'Head Administrator',
    school_name TEXT DEFAULT 'Greenwood Academy',
    school_code TEXT DEFAULT 'GW-2026'
)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    target_institution_id UUID;
    target_session_id UUID;
    c_grade5 UUID;
    c_grade6 UUID;
    c_grade10 UUID;
BEGIN
    -- Step A: Find the user in auth.users by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = admin_email 
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User with email "' || admin_email || '" does not exist yet. Please sign up or create the user in Supabase Authentication first.'
        );
    END IF;

    -- Step B: Insert or retrieve the institution
    SELECT id INTO target_institution_id 
    FROM public.institutions 
    WHERE code = school_code 
    LIMIT 1;

    IF target_institution_id IS NULL THEN
        INSERT INTO public.institutions (
            name,
            code,
            address,
            phone,
            email,
            good_threshold,
            warning_threshold
        ) VALUES (
            school_name,
            school_code,
            '100 Education Blvd, Academic District',
            '+1 (555) 019-2834',
            'office@school.edu',
            90.0,
            75.0
        ) RETURNING id INTO target_institution_id;
    END IF;

    -- Step C: Create or update User Profile
    INSERT INTO public.profiles (
        id,
        institution_id,
        email,
        full_name
    ) VALUES (
        target_user_id,
        target_institution_id,
        admin_email,
        admin_full_name
    ) ON CONFLICT (id) DO UPDATE SET
        institution_id = target_institution_id,
        full_name = admin_full_name;

    -- Step D: Assign Administrator Role in user_roles (Conflict-safe)
    INSERT INTO public.user_roles (
        user_id,
        institution_id,
        role
    ) VALUES (
        target_user_id,
        target_institution_id,
        'admin'
    ) ON CONFLICT (user_id, institution_id) DO UPDATE SET
        role = 'admin';

    -- Step E: Initialize default Academic Session if missing
    SELECT id INTO target_session_id 
    FROM public.academic_sessions 
    WHERE institution_id = target_institution_id AND is_current = true 
    LIMIT 1;

    IF target_session_id IS NULL THEN
        INSERT INTO public.academic_sessions (
            institution_id,
            name,
            start_date,
            end_date,
            is_current
        ) VALUES (
            target_institution_id,
            '2026-2027 Academic Year',
            '2026-08-01',
            '2027-06-30',
            true
        ) RETURNING id INTO target_session_id;
    END IF;

    -- Step F: Initialize Starter Classes and Sections
    INSERT INTO public.classes (institution_id, name, numeric_order)
    VALUES 
        (target_institution_id, 'Grade 5', 5),
        (target_institution_id, 'Grade 6', 6),
        (target_institution_id, 'Grade 10', 10)
    ON CONFLICT (institution_id, name) DO NOTHING;

    SELECT id INTO c_grade5 FROM public.classes WHERE institution_id = target_institution_id AND name = 'Grade 5';
    SELECT id INTO c_grade6 FROM public.classes WHERE institution_id = target_institution_id AND name = 'Grade 6';
    SELECT id INTO c_grade10 FROM public.classes WHERE institution_id = target_institution_id AND name = 'Grade 10';

    IF c_grade5 IS NOT NULL THEN
        INSERT INTO public.sections (institution_id, class_id, name)
        VALUES 
            (target_institution_id, c_grade5, 'Section A'),
            (target_institution_id, c_grade5, 'Section B')
        ON CONFLICT (class_id, name) DO NOTHING;
    END IF;

    IF c_grade6 IS NOT NULL THEN
        INSERT INTO public.sections (institution_id, class_id, name)
        VALUES 
            (target_institution_id, c_grade6, 'Section A')
        ON CONFLICT (class_id, name) DO NOTHING;
    END IF;

    IF c_grade10 IS NOT NULL THEN
        INSERT INTO public.sections (institution_id, class_id, name)
        VALUES 
            (target_institution_id, c_grade10, 'Section A'),
            (target_institution_id, c_grade10, 'Section B')
        ON CONFLICT (class_id, name) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Administrator bootstrapped successfully! Role set to admin.',
        'user_id', target_user_id,
        'institution_id', target_institution_id,
        'school_name', school_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
