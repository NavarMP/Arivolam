-- =================================================================
-- Helper Script: Seed Enrollments for Arivolam Roles
-- =================================================================
-- Run this script in your Supabase SQL Editor to pre-create
-- spots for Admin, Student, Teacher, and Parent roles.
--
-- After running this, simply Sign Up at /auth/signup with the
-- corresponding email to instantly get access to that role.
-- =================================================================

do $$
declare
  sias_id uuid;
begin
  -- 1. Get the existing institution ID (SIAS)
  select id into sias_id from public.institutions where slug = 'sias';
  
  if sias_id is null then
    raise exception 'Institution SIAS not found! Did you run 02_platform_schema.sql?';
  end if;

  -- 2. Create ADMIN enrollment
  -- Login as: admin@sias.edu
  insert into public.enrollments (institution_id, email, role, username, is_claimed)
  values (sias_id, 'admin@sias.edu', 'admin', 'admin_sias', false)
  on conflict (institution_id, email) do nothing; -- Prevent duplicates

  -- 3. Create STUDENT enrollment
  -- Login as: student@sias.edu
  insert into public.enrollments (institution_id, email, role, admission_number, username, is_claimed)
  values (sias_id, 'student@sias.edu', 'student', 'ADM2024001', 'student_sias', false)
  on conflict (institution_id, email) do nothing;

  -- 4. Create TEACHER (Staff) enrollment
  -- Login as: teacher@sias.edu
  insert into public.enrollments (institution_id, email, role, employee_id, username, is_claimed)
  values (sias_id, 'teacher@sias.edu', 'staff', 'EMP001', 'teacher_sias', false)
  on conflict (institution_id, email) do nothing;

  -- 5. Create PARENT enrollment
  -- Login as: parent@sias.edu
  insert into public.enrollments (institution_id, email, role, username, is_claimed)
  values (sias_id, 'parent@sias.edu', 'parent', 'parent_sias', false)
  on conflict (institution_id, email) do nothing;
  
  raise notice '✅ Enrollments seeded! Sign up with these emails to claim roles.';
end $$;


-- =================================================================
-- Helper: Make yourself a DEV ADMIN
-- Replace 'YOUR_EMAIL' with your actual signup email
-- =================================================================
/*
update public.arivolam_profiles
set is_dev_admin = true
where id in (select id from auth.users where email = 'YOUR_EMAIL');
*/
