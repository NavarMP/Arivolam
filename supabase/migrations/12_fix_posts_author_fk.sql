-- ====================================================================
-- Migration: Fix posts author_id foreign key
-- Description: The feed query attempts to join `posts` with `arivolam_profiles` 
--              as `author:arivolam_profiles`, but the posts table currently has 
--              the author_id linking to `auth.users(id)`. This updates it.
-- ====================================================================

-- 1. Drop the incorrect existing foreign key on posts.author_id
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

-- 2. Add the correct foreign key constraint to link author_id to arivolam_profiles
ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES public.arivolam_profiles(id) 
  ON DELETE CASCADE;

-- 3. Notify the PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
