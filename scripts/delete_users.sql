-- =================================================================
-- DELETE USERS SCRIPT (Clean Slate) 🧼
-- =================================================================
-- Deletes BOTH navarmp@gmail.com AND student@sias.edu
-- So you can sign up again cleanly.
-- =================================================================

do $$
declare
  count_deleted int;
begin
  with deleted as (
    delete from auth.users 
    where email in ('navarmp@gmail.com', 'student@sias.edu')
    returning id
  )
  select count(*) into count_deleted from deleted;
  
  if count_deleted > 0 then
    raise notice '✅ Deleted % users! You can Sign Up again now.', count_deleted;
  else
    raise notice '⚠️ No users found to delete.';
  end if;
end $$;
