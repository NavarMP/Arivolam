-- =====================================================
-- 06_add_employee_id.sql
-- Add employee_id to enrollments and update auto-link trigger
-- =====================================================

-- 1. Add employee_id column to enrollments
alter table public.enrollments
add column if not exists employee_id text;

-- 2. Update the trigger function to include employee_id
create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  insert into public.arivolam_profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Auto-link: check if email matches any enrollment
  update public.enrollments
  set linked_user_id = new.id, is_claimed = true
  where (email = new.email or phone = new.phone)
    and is_claimed = false;
  
  -- Auto-create institution_members for auto-linked enrollments
  -- ADDED: employee_id
  insert into public.institution_members (user_id, institution_id, role, register_number, admission_number, employee_id, department)
  select new.id, e.institution_id, e.role, e.register_number, e.admission_number, e.employee_id, e.department
  from public.enrollments e
  where e.linked_user_id = new.id and e.is_claimed = true
  on conflict (user_id, institution_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;
