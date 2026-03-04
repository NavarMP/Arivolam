-- =====================================================
-- 19_assignments_schema.sql
-- Standalone Assignments and Submissions Schema
-- =====================================================

-- ─── Assignments ───
create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  class_id uuid references public.classes on delete cascade not null,
  title text not null,
  description text,
  max_marks numeric(6,2) not null default 100,
  due_date timestamptz not null,
  created_by uuid references public.enrollments(id) on delete set null,
  is_published boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─── Assignment Submissions ───
create table if not exists public.assignment_submissions (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assignments on delete cascade not null,
  student_enrollment_id uuid references public.enrollments(id) on delete cascade not null,
  submission_date timestamptz default now() not null,
  content text,
  file_url text,
  status text not null default 'submitted' check (status in ('submitted', 'graded', 'late')),
  marks_obtained numeric(6,2),
  feedback text,
  graded_by uuid references public.enrollments(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(assignment_id, student_enrollment_id)
);

-- =====================================================
-- Row Level Security
-- =====================================================

alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;

-- Assignments: students/faculty/admins can read (if published or if they are the creator/admin)
create policy "assignments_select" on public.assignments for select using (
  is_published = true 
  or created_by = (select id from public.enrollments e where e.user_id = auth.uid() and e.id = assignments.created_by)
  or exists (
    select 1 from public.institution_members m 
    where m.user_id = auth.uid() and m.institution_id = assignments.institution_id and m.role = 'admin'
  )
);

create policy "assignments_faculty_write" on public.assignments for all using (
  exists (
    select 1 from public.institution_members m 
    where m.user_id = auth.uid() and m.institution_id = assignments.institution_id and m.role in ('admin', 'faculty')
  )
);

-- Submissions: students can see their own, faculty/admins can see all for assignments they can see
create policy "submissions_select" on public.assignment_submissions for select using (
  student_enrollment_id in (select id from public.enrollments e where e.user_id = auth.uid())
  or exists (
    select 1 from public.assignments a
    join public.institution_members m on m.institution_id = a.institution_id
    where a.id = assignment_submissions.assignment_id 
      and m.user_id = auth.uid() 
      and m.role in ('admin', 'faculty')
  )
);

create policy "submissions_student_insert" on public.assignment_submissions for insert with check (
  student_enrollment_id in (select id from public.enrollments e where e.user_id = auth.uid())
);

create policy "submissions_student_update" on public.assignment_submissions for update using (
  student_enrollment_id in (select id from public.enrollments e where e.user_id = auth.uid())
);

create policy "submissions_faculty_update" on public.assignment_submissions for update using (
  exists (
    select 1 from public.assignments a
    join public.institution_members m on m.institution_id = a.institution_id
    where a.id = assignment_submissions.assignment_id 
      and m.user_id = auth.uid() 
      and m.role in ('admin', 'faculty')
  )
);

-- =====================================================
-- Triggers (updated_at)
-- =====================================================

create trigger assignments_updated_at before update on public.assignments
  for each row execute procedure public.update_updated_at();
create trigger assignment_submissions_updated_at before update on public.assignment_submissions
  for each row execute procedure public.update_updated_at();
