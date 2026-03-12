-- =====================================================
-- 25_number_sequences.sql
-- Auto-increment sequences for admission numbers,
-- register numbers, and employee IDs per institution.
-- =====================================================

create table if not exists public.number_sequences (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  
  -- Type: 'admission' (e.g., SIASBCA26023), 'register' (e.g., 627041), 'employee' (e.g., EMP-0001)
  sequence_type text not null check (sequence_type in ('admission', 'register', 'employee')),
  
  -- Scope key for scoped sequences (e.g., 'BCA_26' for admission = dept+year)
  -- Empty string '' for institution-wide sequences (register, employee)
  scope_key text not null default '',
  
  -- Current counter value (last used number)
  current_value integer not null default 0,
  
  -- Zero-padding width for the sequence portion (e.g., 3 → 001, 4 → 0001)
  padding integer not null default 3,
  
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  unique(institution_id, sequence_type, scope_key)
);

-- Enable RLS
alter table public.number_sequences enable row level security;

-- Only institution admins can manage sequences
create policy "number_sequences_select" on public.number_sequences for select using (true);
create policy "number_sequences_admin" on public.number_sequences for all using (
  exists (
    select 1 from public.institution_members m
    where m.user_id = auth.uid()
      and m.institution_id = number_sequences.institution_id
      and m.role = 'admin'
  )
);

-- Keep updated_at accurate
create trigger number_sequences_updated_at
  before update on public.number_sequences
  for each row execute procedure public.update_updated_at();
