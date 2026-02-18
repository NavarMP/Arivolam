-- =================================================================
-- 🚨 EMERGENCY FIX ALL (FINAL VERSION) 🚨
-- =================================================================
-- Run this ENTIRE script in Supabase SQL Editor.
-- It fixes Schema, Constraints, Data, and Permissions in one go.
-- =================================================================

-- 1. FIX SCHEMA: Add missing column 'employee_id'
do $$ 
begin
  alter table public.enrollments add column if not exists employee_id text;
exception
  when duplicate_column then null;
end $$;


-- 2. FIX CONSTRAINTS: Ensure unique constraints exist for 'enrollments'
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_institution_id_email_key') then
    alter table public.enrollments add constraint enrollments_institution_id_email_key unique (institution_id, email);
  end if;
end $$;


-- 3. SEED DATA: Insert enrollments (Safe Upsert)
insert into public.enrollments (institution_id, email, role, admission_number, username, is_claimed)
select id, 'student@sias.edu', 'student', 'ADM2024001', 'student_sias', false
from public.institutions where slug = 'sias'
on conflict (institution_id, email) do nothing;

insert into public.enrollments (institution_id, email, role, username, is_claimed)
select id, 'admin@sias.edu', 'admin', 'admin_sias', false
from public.institutions where slug = 'sias'
on conflict (institution_id, email) do nothing;

insert into public.enrollments (institution_id, email, role, employee_id, username, is_claimed)
select id, 'teacher@sias.edu', 'staff', 'EMP001', 'teacher_sias', false
from public.institutions where slug = 'sias'
on conflict (institution_id, email) do nothing;

insert into public.enrollments (institution_id, email, role, username, is_claimed)
select id, 'parent@sias.edu', 'parent', 'parent_sias', false
from public.institutions where slug = 'sias'
on conflict (institution_id, email) do nothing;


-- 4. FIX STUDENT: Force Link 'student@sias.edu' to SIAS
insert into public.institution_members (user_id, institution_id, role, admission_number)
select 
  (select id from auth.users where email = 'student@sias.edu'),
  (select id from public.institutions where slug = 'sias'),
  'student',
  'ADM2024001'
where exists (select 1 from auth.users where email = 'student@sias.edu')
on conflict (user_id, institution_id) do nothing;


-- 5. FIX NAVARMP: Create Profile if missing
insert into public.arivolam_profiles (id, display_name)
select id, 'Navarmp'
from auth.users where email = 'navarmp@gmail.com'
on conflict (id) do nothing;


-- 6. FIX NAVARMP: Promote to Dev Admin
update public.arivolam_profiles
set is_dev_admin = true
where id in (select id from auth.users where email = 'navarmp@gmail.com');


-- 7. FIX NAVARMP: Link to SIAS as Admin
insert into public.institution_members (user_id, institution_id, role)
select 
  (select id from auth.users where email = 'navarmp@gmail.com'),
  (select id from public.institutions where slug = 'sias'),
  'admin'
where exists (select 1 from auth.users where email = 'navarmp@gmail.com')
on conflict (user_id, institution_id) do nothing;

-- ✅ DONE
