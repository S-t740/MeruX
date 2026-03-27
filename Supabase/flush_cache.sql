-- Run this in your Supabase SQL Editor to fix the {} Error
GRANT ALL ON public.projects TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
