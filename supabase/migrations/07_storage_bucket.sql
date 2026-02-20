-- =====================================================
-- 07_storage_bucket.sql
-- Create storage bucket for post media uploads
-- =====================================================

-- Create the post-media bucket (public read access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  10485760, -- 10MB limit per file
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
) on conflict (id) do nothing;

-- ─── Storage Policies ───

-- Allow authenticated users to upload to their own folder
create policy "Users can upload post media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read post media (public bucket)
create policy "Anyone can read post media"
  on storage.objects for select
  to public
  using (bucket_id = 'post-media');

-- Allow users to delete their own media
create policy "Users can delete own post media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
