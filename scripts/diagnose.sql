-- =================================================================
-- DIAGNOSTIC SCRIPT 🕵️‍♂️
-- =================================================================
-- Run this script and paste the "Results" table in the chat.
-- This will tell us EXACTLY what is missing in your database.
-- =================================================================

with 
  target_user as (select id, email from auth.users where email = 'navarmp@gmail.com'),
  target_student as (select id, email from auth.users where email = 'student@sias.edu'),
  sias_inst as (select id from public.institutions where slug = 'sias')

select 
  '1. Institution (SIAS)' as check_name, 
  case when exists(select 1 from sias_inst) then '✅ FOUND' else '❌ MISSING (Run 02_platform_schema.sql)' end as status, 
  (select id::text from sias_inst) as details

union all

select 
  '2. User (navarmp@gmail.com)',
  case when exists(select 1 from target_user) then '✅ FOUND' else '❌ MISSING (Signup first)' end,
  (select id::text from target_user)

union all

select 
  '3. Profile (navarmp)',
  case when exists(select 1 from public.arivolam_profiles where id in (select id from target_user)) then '✅ FOUND' else '❌ MISSING (Trigger failed)' end,
  'Dev Admin: ' || coalesce((select is_dev_admin::text from public.arivolam_profiles where id in (select id from target_user)), 'N/A')

union all

select 
  '4. Membership (navarmp -> SIAS)',
  case when exists(select 1 from public.institution_members where user_id in (select id from target_user) and institution_id in (select id from sias_inst)) then '✅ FOUND' else '❌ MISSING (Link failed)' end,
  'Role: ' || coalesce((select role from public.institution_members where user_id in (select id from target_user) and institution_id in (select id from sias_inst)), 'None')

union all

select 
  '5. User (student@sias.edu)',
  case when exists(select 1 from target_student) then '✅ FOUND' else '❌ MISSING' end,
  (select id::text from target_student)

union all

select 
  '6. Membership (student -> SIAS)',
  case when exists(select 1 from public.institution_members where user_id in (select id from target_student) and institution_id in (select id from sias_inst)) then '✅ FOUND' else '❌ MISSING' end,
  'Role: ' || coalesce((select role from public.institution_members where user_id in (select id from target_student) and institution_id in (select id from sias_inst)), 'None')
;
