-- Create a table for public profiles using the Supabase starter pattern
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text default 'student' check (role in ('student', 'teacher', 'parent', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.profiles enable row level security;

-- Create policies
-- 1. Public profiles are viewable by everyone (or restrict to authenticated)
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

-- 2. Users can insert their own profile (handled by trigger, but just in case)
create policy "Users can insert their own profile." on public.profiles
  for insert with check ((select auth.uid()) = id);

-- 3. Users can update own profile.
create policy "Users can update own profile." on public.profiles
  for update using ((select auth.uid()) = id);

-- 4. Admins can update all profiles (Requires a way to check if user is admin)
-- We'll use a function or check user metadata if possible, but RLS on metadata is tricky.
-- For simplicity in this demo, we assume the 'admin' role in the profile table itself is the source of truth for RLS, 
-- OR we trust server-side actions which bypass RLS (service role) for admin tasks.
-- Let's stick to standard policies for now.
create policy "Admins can update all profiles." on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'student'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to sync role changes from public.profiles to auth.users
create or replace function public.sync_user_role()
returns trigger as $$
begin
  -- Only update if role has changed
  if old.role is distinct from new.role then
    update auth.users
    set raw_user_meta_data = 
      jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new.role))
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the sync function on profile update
create trigger on_profile_role_updated
  after update on public.profiles
  for each row execute procedure public.sync_user_role();
