-- =================================================================
-- FIX EVERYTHING SCRIPT (ROBUST VERSION)
-- =================================================================
-- 1. Promotes navarmp@gmail.com to Dev Admin (+ creates Missing Profile if needed)
-- 2. Links navarmp@gmail.com as an ADMIN of SIAS
-- 3. Links student@sias.edu as a STUDENT of SIAS (+ creates Missing Profile if needed)
-- 4. Seeds other roles for testing
-- =================================================================

do $$
declare
  sias_id uuid;
  dev_user_id uuid;
  student_user_id uuid;
begin
  -- 1. Get SIAS ID
  select id into sias_id from public.institutions where slug = 'sias';
  if sias_id is null then raise exception 'SIAS Institution not found!'; end if;

  -- =========================================================
  -- A. FIX NAVARMP (Dev Admin + Campus Admin)
  -- =========================================================
  select id into dev_user_id from auth.users where email = 'navarmp@gmail.com';
  
  if dev_user_id is not null then
    -- 1. Create Profile if missing (Force fix for broken trigger)
    insert into public.arivolam_profiles (id, display_name, avatar_url)
    select 
      dev_user_id, 
      coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Navarmp'), 
      raw_user_meta_data->>'avatar_url'
    from auth.users
    where id = dev_user_id
    on conflict (id) do nothing;

    -- 2. Promote to Platform Dev Admin
    update public.arivolam_profiles
    set is_dev_admin = true
    where id = dev_user_id;
    
    -- 3. Link as Institution Admin
    insert into public.institution_members (user_id, institution_id, role)
    values (dev_user_id, sias_id, 'admin')
    on conflict (user_id, institution_id) do nothing;
    
    raise notice '✅ Setup navarmp@gmail.com as Dev Admin + SIAS Admin';
  else
    raise notice '⚠️ User navarmp@gmail.com not found. Did you sign up?';
  end if;

  -- =========================================================
  -- B. FIX STUDENT (student@sias.edu)
  -- =========================================================
  select id into student_user_id from auth.users where email = 'student@sias.edu';
  
  if student_user_id is not null then
    -- 1. Create Profile if missing
    insert into public.arivolam_profiles (id, display_name, avatar_url)
    select 
      student_user_id, 
      coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Student'), 
      raw_user_meta_data->>'avatar_url'
    from auth.users
    where id = student_user_id
    on conflict (id) do nothing;
    
    -- 2. Link as Student
    insert into public.institution_members (user_id, institution_id, role, admission_number)
    values (student_user_id, sias_id, 'student', 'ADM2024001')
    on conflict (user_id, institution_id) do nothing;
    
    raise notice '✅ Linked student@sias.edu to SIAS';
  else
     raise notice '⚠️ User student@sias.edu not found. Did you sign up?';
  end if;

  -- =========================================================
  -- C. SEED OTHER ROLES (for future testing)
  -- =========================================================
  insert into public.enrollments (institution_id, email, role, username, is_claimed)
  values (sias_id, 'admin@sias.edu', 'admin', 'admin_sias', false)
  on conflict (institution_id, email) do nothing;

  insert into public.enrollments (institution_id, email, role, admission_number, username, is_claimed)
  values (sias_id, 'student@sias.edu', 'student', 'ADM2024001', 'student_sias', false)
  on conflict (institution_id, email) do nothing;

  insert into public.enrollments (institution_id, email, role, employee_id, username, is_claimed)
  values (sias_id, 'teacher@sias.edu', 'staff', 'EMP001', 'teacher_sias', false)
  on conflict (institution_id, email) do nothing;

  insert into public.enrollments (institution_id, email, role, username, is_claimed)
  values (sias_id, 'parent@sias.edu', 'parent', 'parent_sias', false)
  on conflict (institution_id, email) do nothing;

  raise notice '🎉 Permissions fixed! Refresh your page.';
end $$;
