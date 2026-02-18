-- =====================================================
-- 05_fix_enrollments.sql
-- Add unique constraint to enrollments table so upserts work
-- =====================================================

-- Add unique constraint on (institution_id, email)
alter table public.enrollments
add constraint enrollments_institution_id_email_key unique (institution_id, email);

-- Also add unique constraint on (institution_id, phone) just in case
alter table public.enrollments
add constraint enrollments_institution_id_phone_key unique (institution_id, phone);
