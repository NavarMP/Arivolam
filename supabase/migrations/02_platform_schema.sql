-- =====================================================
-- 02_platform_schema.sql
-- Platform-level schema: institutions, enrollments,
-- institution_members, and extended user profiles
-- =====================================================

-- ─── Institutions ───
-- Each institution (college/school) registered on the platform
create table if not exists public.institutions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique, -- URL-friendly identifier (e.g., 'sias')
  short_name text, -- Abbreviated name
  logo_url text,
  cover_url text,
  description text,
  website text,
  
  -- Location
  address text,
  city text,
  state text,
  country text default 'India',
  latitude double precision,
  longitude double precision,
  
  -- Settings
  primary_color text default '#ef8119', -- Brand color
  is_active boolean default true,
  is_verified boolean default false,
  
  -- Map
  map_svg_url text, -- SVG campus map file URL
  google_maps_embed text, -- Google Maps embed URL
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── Arivolam Profiles ───
-- Extended user profile for the social layer (extends existing auth.users)
create table if not exists public.arivolam_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique, -- @handle
  display_name text,
  headline text, -- LinkedIn-style headline (e.g., "CS Student at SIAS")
  bio text,
  avatar_url text,
  cover_url text,
  phone text,
  
  -- Social stats (denormalized for perf)
  followers_count integer default 0,
  following_count integer default 0,
  connections_count integer default 0,
  posts_count integer default 0,
  
  -- Platform flags
  is_dev_admin boolean default false, -- Arivolam dev team member
  is_verified boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── Institution Members ───
-- Links users to institutions with a role
create table if not exists public.institution_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  institution_id uuid references public.institutions on delete cascade not null,
  
  role text not null default 'student' check (role in ('admin', 'staff', 'student', 'parent')),
  
  -- Institution-specific identifiers
  register_number text,
  admission_number text,
  employee_id text,
  
  department text,
  designation text, -- e.g., "Professor", "HOD", "Lab Assistant"
  
  is_active boolean default true,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate membership for same user+institution
  unique(user_id, institution_id)
);

-- ─── Enrollments ───
-- Pre-registered enrollment records. When a user signs up with matching
-- email/phone, they auto-link to the institution.
create table if not exists public.enrollments (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  
  -- Match fields (checked against auth.users on signup/login)
  email text,
  phone text,
  
  -- Institution credentials
  register_number text,
  admission_number text,
  username text, -- institution-specific username
  password_hash text, -- bcrypt hash for institution login
  
  role text not null default 'student' check (role in ('admin', 'staff', 'student', 'parent')),
  department text,
  
  -- If already linked to a user
  linked_user_id uuid references auth.users on delete set null,
  is_claimed boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Row Level Security
-- =====================================================

-- Institutions: anyone can read, only dev-admins can write
alter table public.institutions enable row level security;

create policy "Institutions are viewable by everyone"
  on public.institutions for select using (true);

create policy "Dev admins can manage institutions"
  on public.institutions for all using (
    exists (
      select 1 from public.arivolam_profiles
      where id = auth.uid() and is_dev_admin = true
    )
  );

-- Arivolam Profiles: anyone can read, owner can update
alter table public.arivolam_profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.arivolam_profiles for select using (true);

create policy "Users can insert their own profile"
  on public.arivolam_profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.arivolam_profiles for update using (auth.uid() = id);

-- Institution Members: institution members can see co-members
alter table public.institution_members enable row level security;

create policy "Members can view co-members"
  on public.institution_members for select using (
    exists (
      select 1 from public.institution_members as m
      where m.user_id = auth.uid()
        and m.institution_id = institution_members.institution_id
    )
  );

create policy "Users can view their own memberships"
  on public.institution_members for select using (user_id = auth.uid());

create policy "Institution admins can manage members"
  on public.institution_members for all using (
    exists (
      select 1 from public.institution_members as m
      where m.user_id = auth.uid()
        and m.institution_id = institution_members.institution_id
        and m.role = 'admin'
    )
  );

-- Enrollments: institution admins can manage, users can view own
alter table public.enrollments enable row level security;

create policy "Users can view their own enrollment"
  on public.enrollments for select using (linked_user_id = auth.uid());

create policy "Institution admins can manage enrollments"
  on public.enrollments for all using (
    exists (
      select 1 from public.institution_members as m
      where m.user_id = auth.uid()
        and m.institution_id = enrollments.institution_id
        and m.role = 'admin'
    )
  );

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-create arivolam_profile when user signs up
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
  insert into public.institution_members (user_id, institution_id, role, register_number, admission_number, department)
  select new.id, e.institution_id, e.role, e.register_number, e.admission_number, e.department
  from public.enrollments e
  where e.linked_user_id = new.id and e.is_claimed = true
  on conflict (user_id, institution_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop old trigger if exists, create new one
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

-- Update timestamp trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger institutions_updated_at
  before update on public.institutions
  for each row execute procedure public.update_updated_at();

create trigger arivolam_profiles_updated_at
  before update on public.arivolam_profiles
  for each row execute procedure public.update_updated_at();

-- =====================================================
-- Seed: SAFI Institute of Advanced Study
-- =====================================================
insert into public.institutions (name, slug, short_name, description, address, city, state, latitude, longitude, google_maps_embed, is_active, is_verified)
values (
  'SAFI Institute of Advanced Study',
  'sias',
  'SIAS',
  'SAFI Institute of Advanced Study (Autonomous), Vazhayur — A premier institution for higher education in Kerala.',
  'Vazhayur, Malappuram',
  'Malappuram',
  'Kerala',
  11.2274,
  75.9104,
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d978.3654006108488!2d75.91038730295445!3d11.227414666510874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba6452620add83f%3A0x65d2b6e3902bd06a!2sSAFI%20Institute%20of%20Advanced%20Study%20(Autonomous)!5e0!3m2!1sen!2sin!4v1771351120234!5m2!1sen!2sin',
  true,
  true
) on conflict (slug) do nothing;
