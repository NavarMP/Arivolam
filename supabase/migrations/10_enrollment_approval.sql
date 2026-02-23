-- =====================================================
-- 10_enrollment_approval.sql
-- Add approval workflow to enrollments table
-- =====================================================

-- Add is_approved column (default true for backward compatibility with admin-created enrollments)
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;

-- Set existing enrollments as approved
UPDATE public.enrollments SET is_approved = true WHERE is_approved IS NULL;
