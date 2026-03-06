-- Update trigger to handle username from meta data
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.arivolam_profiles (
    id, 
    display_name, 
    username,
    avatar_url, 
    profile_type, 
    website
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'profile_type', 'personal'),
    NEW.raw_user_meta_data->>'website'
  );
  
  -- Auto-link enrollments
  UPDATE public.enrollments
  SET linked_user_id = NEW.id, is_claimed = true
  WHERE (email = NEW.email OR phone = NEW.phone)
    AND is_claimed = false;
  
  -- Auto-create institution_members
  INSERT INTO public.institution_members (user_id, institution_id, role, register_number, admission_number, employee_id, department)
  SELECT NEW.id, e.institution_id, e.role, e.register_number, e.admission_number, e.employee_id, e.department
  FROM public.enrollments e
  WHERE e.linked_user_id = NEW.id AND e.is_claimed = true
  ON CONFLICT (user_id, institution_id) DO NOTHING;
  
  -- Auto-create institution details if it's an institution profile
  IF COALESCE(NEW.raw_user_meta_data->>'profile_type', 'personal') = 'institution' THEN
    INSERT INTO public.institution_profile_details (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
