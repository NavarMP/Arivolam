-- =====================================================
-- 08_user_profiles_upgrade.sql
-- Add profile types, sub-types, and enhanced fields
-- =====================================================

-- ─── Add profile_type column (personal or institution) ───
alter table public.arivolam_profiles
  add column if not exists profile_type text default 'personal'
    check (profile_type in ('personal', 'institution'));

-- ─── Add sub_type for personal accounts ───
alter table public.arivolam_profiles
  add column if not exists sub_type text default 'student'
    check (sub_type in ('student', 'professor', 'researcher', 'alumni', 'visitor', 'parent', null));

-- ─── Add enhanced profile fields ───
alter table public.arivolam_profiles
  add column if not exists cover_url text,
  add column if not exists location text,
  add column if not exists website text,
  add column if not exists education jsonb default '[]'::jsonb,
  add column if not exists experience jsonb default '[]'::jsonb,
  add column if not exists skills text[] default '{}',
  add column if not exists is_verified boolean default false,
  add column if not exists is_public boolean default true;

-- ─── Create index on username for fast profile lookups ───
create index if not exists idx_profiles_username
  on public.arivolam_profiles (username)
  where username is not null;

-- ─── Create index on profile_type ───
create index if not exists idx_profiles_type
  on public.arivolam_profiles (profile_type);

-- ─── Function to check username availability ───
create or replace function public.check_username_available(desired_username text)
returns boolean as $$
begin
  return not exists (
    select 1 from public.arivolam_profiles
    where lower(username) = lower(desired_username)
  );
end;
$$ language plpgsql security definer;

-- ─── Function to claim username during onboarding ───
create or replace function public.claim_username(
  user_id uuid,
  desired_username text,
  p_display_name text default null,
  p_profile_type text default 'personal',
  p_sub_type text default 'student',
  p_headline text default null,
  p_bio text default null
)
returns boolean as $$
declare
  username_clean text;
begin
  -- Sanitize: lowercase, alphanumeric + underscores only, 3-30 chars
  username_clean := lower(trim(desired_username));
  
  if length(username_clean) < 3 or length(username_clean) > 30 then
    raise exception 'Username must be 3-30 characters';
  end if;
  
  if username_clean !~ '^[a-z0-9_]+$' then
    raise exception 'Username can only contain lowercase letters, numbers, and underscores';
  end if;
  
  -- Check availability
  if not public.check_username_available(username_clean) then
    raise exception 'Username is already taken';
  end if;
  
  -- Update the profile
  update public.arivolam_profiles
  set
    username = username_clean,
    display_name = coalesce(p_display_name, display_name),
    profile_type = p_profile_type,
    sub_type = case when p_profile_type = 'personal' then p_sub_type else null end,
    headline = coalesce(p_headline, headline),
    bio = coalesce(p_bio, bio),
    updated_at = now()
  where id = user_id;
  
  return true;
end;
$$ language plpgsql security definer;

-- ─── RLS: Allow public to read public profiles by username ───
create policy "Public profiles are viewable by everyone"
  on public.arivolam_profiles for select
  to public
  using (is_public = true);
