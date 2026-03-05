-- =====================================================
-- 21_institution_media_bucket.sql
-- Create storage bucket for institution logo and cover images
-- =====================================================

-- Create the institution-media bucket (public read access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'institution-media',
  'institution-media',
  true,
  5242880, -- 5MB limit per file
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- ─── Storage Policies ───

-- Allow authenticated users to upload media (ideally should be institution admins only, but we simplify by relying on application layer/RLS based on users for now, or just authenticated as per usual)
create policy "Authenticated users can upload institution media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'institution-media'
  );

-- Allow anyone to read institution media (public bucket)
create policy "Anyone can read institution media"
  on storage.objects for select
  to public
  using (bucket_id = 'institution-media');

-- Allow users to delete institution media
create policy "Authenticated users can delete institution media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'institution-media'
  );
