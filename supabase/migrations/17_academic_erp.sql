-- =====================================================
-- 17_academic_erp.sql
-- Academic ERP Schema: departments, classes, semesters,
-- periods, subjects, timetable, attendance, exams, marks,
-- calendar events
-- =====================================================

-- ─── Semesters ───
-- Admin-created semesters (e.g., "Semester 1", "2026 Jan-May Sem 2")
create table if not exists public.semesters (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  name text not null,              -- e.g., "Semester 1", "2026 Jan-May"
  number integer,                  -- optional numeric order (1, 2, 3...)
  academic_year text,              -- e.g., "2025-2026"
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(institution_id, name, academic_year)
);

-- ─── Departments ───
create table if not exists public.departments (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  name text not null,              -- e.g., "Computer Science"
  code text not null,              -- e.g., "CS"
  description text,
  hod_enrollment_id uuid references public.enrollments(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(institution_id, code)
);

-- ─── Classes ───
-- A class/section within a department and semester (e.g., "CS-A Sem 3")
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  department_id uuid references public.departments on delete cascade not null,
  semester_id uuid references public.semesters on delete cascade not null,
  name text not null,              -- e.g., "CS-A", "ECE-B"
  section text,                    -- e.g., "A", "B"
  max_students integer default 60,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─── Periods / Hours ───
-- Time slots for the daily timetable
create table if not exists public.periods (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  name text not null,              -- e.g., "Period 1", "Lunch Break"
  start_time time not null,        -- e.g., '09:00'
  end_time time not null,          -- e.g., '09:50'
  sort_order integer not null default 0,
  is_break boolean default false,  -- true for lunch/tea breaks
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─── Subjects / Papers ───
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  department_id uuid references public.departments on delete cascade not null,
  semester_id uuid references public.semesters on delete set null,
  name text not null,              -- e.g., "Data Structures"
  code text not null,              -- e.g., "CS301"
  credits integer default 3,
  subject_type text default 'theory' check (subject_type in ('theory', 'lab', 'elective', 'project')),
  description text,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(department_id, code)
);

-- ─── Faculty ↔ Subject Assignment ───
-- Assigns a faculty member to teach a subject for a specific class
create table if not exists public.faculty_subjects (
  id uuid default gen_random_uuid() primary key,
  enrollment_id uuid references public.enrollments(id) on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  class_id uuid references public.classes on delete cascade not null,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  unique(enrollment_id, subject_id, class_id)
);

-- ─── Student ↔ Class Enrollment ───
-- One student belongs to exactly one class at a time
create table if not exists public.student_classes (
  id uuid default gen_random_uuid() primary key,
  enrollment_id uuid references public.enrollments(id) on delete cascade not null unique,
  class_id uuid references public.classes on delete cascade not null,
  roll_number text,
  is_active boolean default true,
  created_at timestamptz default now() not null
);

-- ─── Timetable Entries ───
-- Weekly recurring schedule: maps class + period + day to a subject+faculty
create table if not exists public.timetable_entries (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  faculty_subject_id uuid references public.faculty_subjects on delete set null,
  period_id uuid references public.periods on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday, 1=Monday...6=Saturday
  room text,                       -- e.g., "Room 301", "Lab 2"
  is_active boolean default true,
  created_at timestamptz default now() not null,
  unique(class_id, period_id, day_of_week)
);

-- ─── Attendance ───
-- One record per student per timetable entry per date
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  student_enrollment_id uuid references public.enrollments(id) on delete cascade not null,
  timetable_entry_id uuid references public.timetable_entries on delete cascade not null,
  date date not null,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'od', 'leave')),
  marked_by uuid references public.enrollments(id) on delete set null, -- faculty who marked
  remarks text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(student_enrollment_id, timetable_entry_id, date)
);

-- ─── Exams ───
-- Flexible exam types: internal, external, assignment, seminar, project, etc.
create table if not exists public.exams (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  class_id uuid references public.classes on delete cascade not null,
  semester_id uuid references public.semesters on delete set null,
  exam_type text not null check (exam_type in ('internal', 'external', 'assignment', 'seminar', 'project', 'lab', 'other')),
  name text not null,              -- e.g., "Internal Assessment 1", "End Semester Exam"
  max_marks numeric(6,2) not null default 100,
  weightage numeric(5,2),          -- percentage weight in final grade
  exam_date date,
  description text,
  is_published boolean default false,  -- whether students can see marks
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─── Exam Marks ───
create table if not exists public.exam_marks (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams on delete cascade not null,
  student_enrollment_id uuid references public.enrollments(id) on delete cascade not null,
  marks_obtained numeric(6,2),
  is_absent boolean default false,
  remarks text,
  entered_by uuid references public.enrollments(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(exam_id, student_enrollment_id)
);

-- ─── Calendar Events ───
-- Both institution-wide and department-specific events
create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  department_id uuid references public.departments on delete cascade, -- null = institution-wide
  title text not null,
  description text,
  event_type text default 'general' check (event_type in ('general', 'exam', 'holiday', 'meeting', 'seminar', 'workshop', 'sports', 'cultural', 'other')),
  start_date timestamptz not null,
  end_date timestamptz,
  all_day boolean default false,
  location text,
  color text,                      -- hex color for calendar display
  created_by uuid references public.enrollments(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =====================================================
-- Row Level Security
-- =====================================================

-- Helper: check if user is institution admin (via enrollment)
-- We rely on server-side actions with service role client for most operations,
-- but add policies for completeness.

alter table public.semesters enable row level security;
alter table public.departments enable row level security;
alter table public.classes enable row level security;
alter table public.periods enable row level security;
alter table public.subjects enable row level security;
alter table public.faculty_subjects enable row level security;
alter table public.student_classes enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.attendance enable row level security;
alter table public.exams enable row level security;
alter table public.exam_marks enable row level security;
alter table public.calendar_events enable row level security;

-- Semesters: institution members can read, admins can write
create policy "semesters_select" on public.semesters for select using (true);
create policy "semesters_admin" on public.semesters for all using (
  exists (
    select 1 from public.institution_members m
    where m.user_id = auth.uid()
      and m.institution_id = semesters.institution_id
      and m.role = 'admin'
  )
);

-- Departments: institution members can read, admins can write
create policy "departments_select" on public.departments for select using (true);
create policy "departments_admin" on public.departments for all using (
  exists (
    select 1 from public.institution_members m
    where m.user_id = auth.uid()
      and m.institution_id = departments.institution_id
      and m.role = 'admin'
  )
);

-- Classes: anyone can read, admins can write (via department → institution)
create policy "classes_select" on public.classes for select using (true);
create policy "classes_admin" on public.classes for all using (
  exists (
    select 1 from public.departments d
    join public.institution_members m on m.institution_id = d.institution_id
    where d.id = classes.department_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

-- Periods: anyone can read, admins can write
create policy "periods_select" on public.periods for select using (true);
create policy "periods_admin" on public.periods for all using (
  exists (
    select 1 from public.institution_members m
    where m.user_id = auth.uid()
      and m.institution_id = periods.institution_id
      and m.role = 'admin'
  )
);

-- Subjects: anyone can read, admins can write
create policy "subjects_select" on public.subjects for select using (true);
create policy "subjects_admin" on public.subjects for all using (
  exists (
    select 1 from public.departments d
    join public.institution_members m on m.institution_id = d.institution_id
    where d.id = subjects.department_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

-- Faculty Subjects: anyone can read, admins can write
create policy "faculty_subjects_select" on public.faculty_subjects for select using (true);
create policy "faculty_subjects_admin" on public.faculty_subjects for all using (
  exists (
    select 1 from public.classes c
    join public.departments d on d.id = c.department_id
    join public.institution_members m on m.institution_id = d.institution_id
    where c.id = faculty_subjects.class_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

-- Student Classes: anyone can read, admins can write
create policy "student_classes_select" on public.student_classes for select using (true);
create policy "student_classes_admin" on public.student_classes for all using (
  exists (
    select 1 from public.classes c
    join public.departments d on d.id = c.department_id
    join public.institution_members m on m.institution_id = d.institution_id
    where c.id = student_classes.class_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

-- Timetable: anyone can read, admins can write
create policy "timetable_select" on public.timetable_entries for select using (true);
create policy "timetable_admin" on public.timetable_entries for all using (
  exists (
    select 1 from public.classes c
    join public.departments d on d.id = c.department_id
    join public.institution_members m on m.institution_id = d.institution_id
    where c.id = timetable_entries.class_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

-- Attendance: students can read own, faculty can read/write for their classes, admins can do all
create policy "attendance_select" on public.attendance for select using (true);
create policy "attendance_faculty_insert" on public.attendance for insert with check (true);
create policy "attendance_faculty_update" on public.attendance for update using (true);

-- Exams: anyone can read published, admins/faculty can write
create policy "exams_select" on public.exams for select using (true);
create policy "exams_admin" on public.exams for all using (
  exists (
    select 1 from public.institution_members m
    where m.user_id = auth.uid()
      and m.institution_id = exams.institution_id
      and m.role in ('admin', 'faculty')
  )
);

-- Exam Marks: students can read own, faculty can write
create policy "exam_marks_select" on public.exam_marks for select using (true);
create policy "exam_marks_write" on public.exam_marks for insert with check (true);
create policy "exam_marks_update" on public.exam_marks for update using (true);

-- Calendar Events: anyone can read, admins can write
create policy "calendar_events_select" on public.calendar_events for select using (true);
create policy "calendar_events_admin" on public.calendar_events for all using (
  exists (
    select 1 from public.institution_members m
    where m.user_id = auth.uid()
      and m.institution_id = calendar_events.institution_id
      and m.role = 'admin'
  )
);

-- =====================================================
-- Triggers (updated_at)
-- =====================================================

create trigger semesters_updated_at before update on public.semesters
  for each row execute procedure public.update_updated_at();
create trigger departments_updated_at before update on public.departments
  for each row execute procedure public.update_updated_at();
create trigger attendance_updated_at before update on public.attendance
  for each row execute procedure public.update_updated_at();
create trigger exams_updated_at before update on public.exams
  for each row execute procedure public.update_updated_at();
create trigger exam_marks_updated_at before update on public.exam_marks
  for each row execute procedure public.update_updated_at();
create trigger calendar_events_updated_at before update on public.calendar_events
  for each row execute procedure public.update_updated_at();
