-- =====================================================
-- 11_enrollment_fullname.sql
-- Add full_name column to enrollments table
-- =====================================================

ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS full_name text;
