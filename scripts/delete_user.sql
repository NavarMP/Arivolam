-- =================================================================
-- DELETE USER SCRIPT (Nuclear Option) ☢️
-- =================================================================
-- 1. Deletes "navarmp@gmail.com" from auth.users
-- 2. Clean slate for you to sign up again
-- =================================================================

do $$
declare
  user_id uuid;
  target_email text := 'navarmp@gmail.com'; -- 👈 HARDCODED EMAIL TO DELETE
begin
  select id into user_id from auth.users where email = target_email;
  
  if user_id is not null then
    delete from auth.users where id = user_id;
    raise notice '✅ User % deleted! You can Sign Up again now.', target_email;
  else
    raise notice '⚠️ User % not found. You can just Sign Up normally.', target_email;
  end if;
end $$;
