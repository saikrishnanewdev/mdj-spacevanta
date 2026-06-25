-- SQL Schema for MDJ SpaceVanta Backend (Supabase / PostgreSQL)
-- This file contains table structures, relationships, and Row Level Security (RLS) rules.
-- Designed to be idempotent (can be re-run safely multiple times).

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLE CREATION (IF NOT EXISTS)
-- ==========================================

-- Schools
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Demo Requests
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    school_name TEXT NOT NULL,
    mobile_number TEXT,
    status TEXT DEFAULT 'pending'::text NOT NULL CHECK (status IN ('pending', 'contacted', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idempotent Migration for Existing Databases
ALTER TABLE public.demo_requests ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.demo_requests ADD COLUMN IF NOT EXISTS mobile_number TEXT;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demo_requests' AND column_name='company') THEN
        UPDATE public.demo_requests SET school_name = company WHERE school_name IS NULL;
        ALTER TABLE public.demo_requests ALTER COLUMN school_name SET NOT NULL;
        ALTER TABLE public.demo_requests DROP COLUMN IF EXISTS company;
    END IF;
END $$;

-- Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    class_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure roll number is unique within the same school
    CONSTRAINT unique_school_roll_number UNIQUE (school_id, roll_number)
);

-- Admins
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure admin username is unique within the same school
    CONSTRAINT unique_school_username UNIQUE (school_id, username)
);

-- Exams
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    question_paper_url TEXT,
    answer_key_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Student Exams
CREATE TABLE IF NOT EXISTS public.student_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    scanned_paper_url TEXT,
    score NUMERIC,
    ai_feedback TEXT,
    status TEXT DEFAULT 'pending_eval'::text NOT NULL CHECK (status IN ('pending_eval', 'evaluated', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exams ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. POLICIES RESET & CREATION
-- ==========================================

-- Schools Policies
DROP POLICY IF EXISTS "Allow public read access to schools" ON public.schools;
CREATE POLICY "Allow public read access to schools" ON public.schools
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to schools" ON public.schools;
CREATE POLICY "Allow public insert access to schools" ON public.schools
    FOR INSERT WITH CHECK (true);

-- Profiles Policies
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.profiles;
CREATE POLICY "Allow users to read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Demo Requests Policies
DROP POLICY IF EXISTS "Allow public inserts for demo requests" ON public.demo_requests;
CREATE POLICY "Allow public inserts for demo requests" ON public.demo_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin read access for demo requests" ON public.demo_requests;
CREATE POLICY "Allow admin read access for demo requests" ON public.demo_requests
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Students Policies
DROP POLICY IF EXISTS "Allow student read own data" ON public.students;
CREATE POLICY "Allow student read own data" ON public.students
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow school admins access to students" ON public.students;
CREATE POLICY "Allow school admins access to students" ON public.students
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin' 
              AND profiles.school_id = students.school_id
        )
    );

-- Admins Policies
DROP POLICY IF EXISTS "Allow admin access own data" ON public.admins;
CREATE POLICY "Allow admin access own data" ON public.admins
    FOR ALL USING (auth.uid() = id);

-- Exams Policies
DROP POLICY IF EXISTS "Allow school members to select exams" ON public.exams;
CREATE POLICY "Allow school members to select exams" ON public.exams
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.school_id = exams.school_id
        )
    );

DROP POLICY IF EXISTS "Allow school admins full access to exams" ON public.exams;
CREATE POLICY "Allow school admins full access to exams" ON public.exams
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.school_id = exams.school_id
        )
    );

-- Student Exams Policies
DROP POLICY IF EXISTS "Allow students to read own exam scores" ON public.student_exams;
CREATE POLICY "Allow students to read own exam scores" ON public.student_exams
    FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Allow school admins access to student exams" ON public.student_exams;
CREATE POLICY "Allow school admins access to student exams" ON public.student_exams
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin' 
              AND profiles.school_id = (SELECT school_id FROM public.exams WHERE exams.id = student_exams.exam_id)
        )
    );



-- ==========================================
-- 4. TRIGGER FUNCTIONS
-- ==========================================

-- Automatically inserts a record in public.profiles when a new user registers in auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_school_id UUID;
  v_full_name TEXT;
  v_parts TEXT[];
BEGIN
  -- 1. Try to parse metadata first
  v_role := new.raw_user_meta_data->>'role';
  v_school_id := (new.raw_user_meta_data->>'school_id')::UUID;
  v_full_name := new.raw_user_meta_data->>'full_name';

  -- 2. Fallback: Parse virtual email if metadata is empty (e.g. created directly in Supabase UI)
  IF (v_school_id IS NULL OR v_role IS NULL) AND new.email LIKE '%@spacevanta.local' THEN
    v_parts := regexp_split_to_array(split_part(new.email, '@', 1), '_');
    IF array_length(v_parts, 1) >= 3 THEN
      v_role := v_parts[1]; -- 'admin' or 'student'
      
      -- Safely parse school_id to check if it's a valid UUID
      BEGIN
        v_school_id := v_parts[2]::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_school_id := NULL;
      END;

      v_full_name := COALESCE(v_full_name, 'Principal');
      
      IF v_school_id IS NOT NULL THEN
        -- Insert profile
        INSERT INTO public.profiles (id, school_id, role, full_name)
        VALUES (new.id, v_school_id, v_role, v_full_name);

        IF v_role = 'student' THEN
          INSERT INTO public.students (id, school_id, roll_number, class_name)
          VALUES (
            new.id,
            v_school_id,
            v_parts[3], -- roll_number
            COALESCE(new.raw_user_meta_data->>'class_name', 'Default Class')
          );
        ELSIF v_role = 'admin' THEN
          INSERT INTO public.admins (id, school_id, username)
          VALUES (
            new.id,
            v_school_id,
            v_parts[3] -- username
          );
        END IF;

        RETURN NEW;
      END IF;
    END IF;
  END IF;

  -- 3. If standard metadata signup or fallback failed
  v_role := COALESCE(v_role, 'student');
  v_full_name := COALESCE(v_full_name, 'Imported Account');

  -- Insert profile
  INSERT INTO public.profiles (id, school_id, role, full_name)
  VALUES (new.id, v_school_id, v_role, v_full_name);

  -- Insert specific role record ONLY if school_id is NOT NULL
  IF v_school_id IS NOT NULL THEN
    IF v_role = 'student' THEN
      INSERT INTO public.students (id, school_id, roll_number, class_name)
      VALUES (
        new.id,
        v_school_id,
        COALESCE(new.raw_user_meta_data->>'roll_number', ''),
        COALESCE(new.raw_user_meta_data->>'class_name', '')
      );
    ELSIF v_role = 'admin' THEN
      INSERT INTO public.admins (id, school_id, username)
      VALUES (
        new.id,
        v_school_id,
        COALESCE(new.raw_user_meta_data->>'username', '')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Demo notifications function
CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION public.notify_product_owner_on_demo()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-api-endpoint.com/send-demo-email'::text,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'fullName', NEW.full_name,
      'email', NEW.email,
      'schoolName', NEW.school_name,
      'mobileNumber', NEW.mobile_number,
      'submittedAt', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC function to create students (admin context)
CREATE OR REPLACE FUNCTION public.create_student_user(
    p_school_id UUID,
    p_roll_number TEXT,
    p_class_name TEXT,
    p_full_name TEXT,
    p_password TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can create students.';
    END IF;

    v_email := 'student_' || p_school_id || '_' || LOWER(TRIM(p_roll_number)) || '@spacevanta.local';

    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Student with Roll Number % already exists in this school.', p_roll_number;
    END IF;

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object(
            'school_id', p_school_id,
            'role', 'student',
            'full_name', p_full_name,
            'roll_number', p_roll_number,
            'class_name', p_class_name
        )::jsonb,
        false,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC function to create other admins (admin context)
CREATE OR REPLACE FUNCTION public.create_admin_user(
    p_school_id UUID,
    p_username TEXT,
    p_full_name TEXT,
    p_password TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can create other administrators.';
    END IF;

    v_email := 'admin_' || p_school_id || '_' || LOWER(TRIM(p_username)) || '@spacevanta.local';

    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Admin with Username % already exists in this school.', p_username;
    END IF;

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object(
            'school_id', p_school_id,
            'role', 'admin',
            'full_name', p_full_name,
            'username', p_username
        )::jsonb,
        false,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 5. TRIGGER CREATION
-- ==========================================

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for demo email notifications
DROP TRIGGER IF EXISTS trigger_send_demo_email ON public.demo_requests;
CREATE TRIGGER trigger_send_demo_email
  AFTER INSERT ON public.demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_product_owner_on_demo();


-- ==========================================
-- 6. PUBLIC METADATA HELPERS FOR STUDENT LOGIN
-- ==========================================

-- Get all unique class names for a school
CREATE OR REPLACE FUNCTION public.get_school_classes(p_school_id UUID)
RETURNS TABLE (class_name TEXT) AS $$
BEGIN
    RETURN QUERY 
    SELECT DISTINCT s.class_name 
    FROM public.students s 
    WHERE s.school_id = p_school_id
    ORDER BY s.class_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get all unique roll numbers for a school and class
CREATE OR REPLACE FUNCTION public.get_class_roll_numbers(p_school_id UUID, p_class_name TEXT)
RETURNS TABLE (roll_number TEXT) AS $$
BEGIN
    RETURN QUERY 
    SELECT DISTINCT s.roll_number 
    FROM public.students s 
    WHERE s.school_id = p_school_id AND s.class_name = p_class_name
    ORDER BY s.roll_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 7. STORAGE BUCKET CONFIGURATION & POLICIES
-- ==========================================

-- Create the public bucket 'papers' if it doesn't exist (in storage.buckets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('papers', 'papers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'papers' bucket

-- 1. Allow authenticated administrators to upload (insert) files to the 'papers' bucket
DROP POLICY IF EXISTS "Allow admins to upload papers" ON storage.objects;
CREATE POLICY "Allow admins to upload papers" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'papers' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Allow everyone (public/authenticated) to view files in the 'papers' bucket
DROP POLICY IF EXISTS "Allow public read access to papers" ON storage.objects;
CREATE POLICY "Allow public read access to papers" ON storage.objects
    FOR SELECT USING (bucket_id = 'papers');

