-- =====================================================
-- 22_institution_profiles.sql
-- Add schema for institution profiles, generic accreditations, and update profile tracking
-- =====================================================

-- 1. Create institution profile details table
CREATE TABLE IF NOT EXISTS public.institution_profile_details (
  id UUID REFERENCES public.arivolam_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Basic Info
  institution_type TEXT CHECK (institution_type IN ('university', 'college', 'school', 'polytechnic', 'research_institute', 'other')),
  established_year INTEGER,
  affiliation TEXT,           -- e.g., "University of Calicut", "Mahatma Gandhi University"
  
  -- Accreditations & Rankings (generic — any body, any grading system)
  accreditations JSONB DEFAULT '[]'::JSONB,
  -- Each entry: {body: "NAAC", grade: "A++", valid_until: "2028-12-31", certificate_url: "..."}
  -- or: {body: "NBA", grade: "Tier-1", valid_until: null, certificate_url: null}
  rankings JSONB DEFAULT '[]'::JSONB,
  -- Each entry: {organization: "NIRF", rank: 45, year: 2025, category: "Engineering"}
  
  -- Admission
  admission_info TEXT,
  admission_url TEXT,
  admission_open BOOLEAN DEFAULT FALSE,
  minimum_qualification TEXT,
  entrance_exams TEXT[],      -- e.g., {"KEAM", "CUET", "JEE"}
  
  -- Academic
  courses_offered JSONB DEFAULT '[]'::JSONB,  -- [{name, degree, duration, department}]
  departments TEXT[],
  
  -- Achievements
  achievements JSONB DEFAULT '[]'::JSONB,  -- [{title, description, year, icon?}]
  
  -- Contact & Social
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Gallery
  gallery_images JSONB DEFAULT '[]'::JSONB,  -- [{url, caption}]
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for institution_profile_details
ALTER TABLE public.institution_profile_details ENABLE ROW LEVEL SECURITY;

-- Everyone can view institution profile details
CREATE POLICY "Institution profiles are viewable by everyone" 
ON public.institution_profile_details FOR SELECT 
USING (true);

-- Users can only modify their own institution profile
CREATE POLICY "Users can insert own institution profile" 
ON public.institution_profile_details FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own institution profile" 
ON public.institution_profile_details FOR UPDATE 
USING (auth.uid() = id);

-- 2. Add social links to arivolam_profiles
ALTER TABLE public.arivolam_profiles
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::JSONB;

-- 3. Update the handle_new_user_profile trigger to respect profile_type and website
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.arivolam_profiles (
    id, 
    display_name, 
    avatar_url, 
    profile_type, 
    website
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'profile_type', 'personal'),
    NEW.raw_user_meta_data->>'website'
  );
  
  -- Auto-link: check if email matches any enrollment
  UPDATE public.enrollments
  SET linked_user_id = NEW.id, is_claimed = true
  WHERE (email = NEW.email OR phone = NEW.phone)
    AND is_claimed = false;
  
  -- Auto-create institution_members for auto-linked enrollments
  INSERT INTO public.institution_members (user_id, institution_id, role, register_number, admission_number, employee_id, department)
  SELECT NEW.id, e.institution_id, e.role, e.register_number, e.admission_number, e.employee_id, e.department
  FROM public.enrollments e
  WHERE e.linked_user_id = NEW.id AND e.is_claimed = true
  ON CONFLICT (user_id, institution_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to delete user account securely
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Perform cascade deletion by deleting from auth.users
  -- Tables referencing auth.users with ON DELETE CASCADE will automatically be cleaned up.
  -- This includes public.arivolam_profiles and subsequently public.institution_profile_details.
  DELETE FROM auth.users WHERE id = user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
