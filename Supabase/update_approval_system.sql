-- 1. Ensure the is_approved column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- 2. Drop the existing trigger to cleanly replace it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role public.user_role;
  v_is_approved boolean;
BEGIN
  -- Validate the requested role or default to 'student'
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'student'::public.user_role
    );
  EXCEPTION WHEN OTHERS THEN
    v_role := 'student'::public.user_role;
  END;

  -- Auto-approve students and super admins.
  -- Instructors, mentors, and tutors must be approved manually.
  IF v_role IN ('student', 'admin', 'super_admin') THEN
    v_is_approved := true;
  ELSE
    v_is_approved := false;
  END IF;

  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    avatar_url,
    role,
    is_approved
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    v_role,
    v_is_approved
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create the trigger using the updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Back-fill auto-approvals for existing students and admins (just to be safe)
UPDATE public.profiles 
SET is_approved = true 
WHERE role IN ('student', 'admin', 'super_admin') AND is_approved = false;
