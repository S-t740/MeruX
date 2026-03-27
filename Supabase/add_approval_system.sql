-- Add is_approved column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Auto-approve existing students/admins
UPDATE public.profiles SET is_approved = true WHERE role IN ('student', 'admin', 'super_admin');

-- Drop the old trigger so we can cleanly replace it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the new user trigger to map 'role' and apply auto-approval for students
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

  -- Only auto-approve students. Mentors and Instructors must be approved manually.
  IF v_role = 'student' THEN
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

-- Re-create the trigger using the updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
