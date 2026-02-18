-- DIAGNOSTIC SCRIPT (PART 2)
-- Run this and tell me the output.

select 
  u.email, 
  m.role, 
  i.slug
from auth.users u
join public.institution_members m on m.user_id = u.id
join public.institutions i on i.id = m.institution_id
where u.email = 'student@sias.edu';
