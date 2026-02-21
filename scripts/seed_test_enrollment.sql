-- IMPORTANT: This is for testing the Isolated ERP Login flow only.

-- First, make sure you don't already have a testuser with this admission_number
DELETE FROM public.enrollments WHERE admission_number = 'TESTBCA001';

-- Insert the test enrollment directly into the enrollments table
-- password_hash is for 'SecurePassword123!'
INSERT INTO public.enrollments (
    institution_id,
    role,
    admission_number,
    username,
    password_hash,
    is_claimed
) 
SELECT 
    id, 
    'student', 
    'TESTBCA001', 
    'testbca001', 
    '$2a$10$vI8aE8W2r0K9iLp8/Q2D.OP.L9oT89q.6cR35fA3C/eM/A.L8tZ3m', 
    false
FROM public.institutions 
WHERE slug = 'sias'
LIMIT 1;

-- Verification:
-- Go to http://localhost:3000/auth/institution-login
-- 1. Select Institution: SIAS
-- 2. Identifier: TESTBCA001
-- 3. Password: SecurePassword123!
