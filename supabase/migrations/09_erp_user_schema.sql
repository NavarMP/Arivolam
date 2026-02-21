-- =====================================================
-- 09_erp_user_schema.sql
-- Isolated table for ERP Users (students, staff, admin, etc.)
-- to decouple from the Social Arivolam Profiles completely.
-- =====================================================

create table if not exists public.erp_users (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  
  -- Identity & Credentials
  register_number text,
  admission_number text,
  email text,
  password_hash text, -- Explicitly handling separate login purely for ERP 
  
  -- Profile Info
  full_name text not null,
  department text,
  semester integer,
  batch_year text,
  avatar_url text,
  
  -- Role & Access
  role text default 'student' check (role in ('student', 'alumni', 'staff', 'admin', 'parent')),
  is_active boolean default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints: Ensure uniqueness within an institution
  unique(institution_id, register_number),
  unique(institution_id, admission_number)
);

-- Enable Row Level Security
alter table public.erp_users enable row level security;

-- Basic Policies (Assumption: Server-side Next.js logic will bypass RLS using service role for custom auth,
-- but we allow read access if they have a custom JWT claiming their ERP user ID)
create policy "ERP users can view their own profile"
  on public.erp_users for select using (
    -- If using custom JWTs, checking app_metadata -> erp_user_id
    current_setting('request.jwt.claims', true)::json->>'erp_user_id' = id::text
  );

create policy "Institution admins can manage their ERP users"
  on public.erp_users for all using (
    exists (
      select 1 from public.institution_members as m
      where m.user_id = auth.uid()
        and m.institution_id = erp_users.institution_id
        and m.role = 'admin'
    )
  );

-- Keep updated_at accurate
create trigger erp_users_updated_at
  before update on public.erp_users
  for each row execute procedure public.update_updated_at();
