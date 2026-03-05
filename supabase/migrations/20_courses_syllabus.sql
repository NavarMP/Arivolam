-- =====================================================
-- 20_courses_syllabus.sql
-- Courses, Course Years, and Syllabus Management
-- =====================================================

-- ─── Courses ───
-- A degree program offered by a department (e.g., "B.Tech Computer Science", "BCA")
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  department_id uuid references public.departments on delete cascade not null,
  name text not null,                -- e.g., "Bachelor of Technology - Computer Science"
  code text not null,                -- e.g., "BTECH-CS"
  short_name text,                   -- e.g., "B.Tech CS"
  duration_years integer default 4,  -- Program duration in years
  degree_type text default 'undergraduate' check (degree_type in ('undergraduate', 'postgraduate', 'diploma', 'certificate', 'doctorate')),
  description text,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(department_id, code)
);

-- ─── Course Years ───
-- Academic years within a course (e.g., "1st Year", "2nd Year")
create table if not exists public.course_years (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses on delete cascade not null,
  year_number integer not null,      -- 1, 2, 3, 4
  name text not null,                -- e.g., "First Year", "2nd Year"
  is_active boolean default true,
  created_at timestamptz default now() not null,
  unique(course_id, year_number)
);

-- ─── Syllabus Entries ───
-- Maps subjects to specific course years with additional curriculum metadata
create table if not exists public.syllabus_entries (
  id uuid default gen_random_uuid() primary key,
  course_year_id uuid references public.course_years on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  semester_id uuid references public.semesters on delete set null,
  is_elective boolean default false,
  is_mandatory boolean default true,
  sort_order integer default 0,
  notes text,                        -- Additional notes about this entry
  is_active boolean default true,
  created_at timestamptz default now() not null,
  unique(course_year_id, subject_id)
);

-- ─── Map access settings ───
-- Add map_access column to institutions for access control
alter table public.institutions
  add column if not exists map_access text default 'public'
  check (map_access in ('public', 'private', 'link_only'));

-- ─── RLS Policies ───
alter table public.courses enable row level security;
alter table public.course_years enable row level security;
alter table public.syllabus_entries enable row level security;

-- Read access via department → institution chain
create policy "courses_read" on public.courses for select using (
  exists (
    select 1 from public.departments d
    where d.id = courses.department_id
  )
);

create policy "course_years_read" on public.course_years for select using (
  exists (
    select 1 from public.courses c
    join public.departments d on d.id = c.department_id
    where c.id = course_years.course_id
  )
);

create policy "syllabus_entries_read" on public.syllabus_entries for select using (
  exists (
    select 1 from public.course_years cy
    join public.courses c on c.id = cy.course_id
    join public.departments d on d.id = c.department_id
    where cy.id = syllabus_entries.course_year_id
  )
);
