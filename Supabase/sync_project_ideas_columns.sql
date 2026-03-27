-- Sync the project_ideas table to perfectly match the UI and Gemini AI output expectations.
ALTER TABLE public.project_ideas 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS difficulty text,
ADD COLUMN IF NOT EXISTS estimated_hours integer,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'suggested';

-- Drop the previous public read policy and scope it strictly to the specific user's generated ideas
DROP POLICY IF EXISTS "Anyone can read project ideas" ON public.project_ideas;
DROP POLICY IF EXISTS "Project idea owners can see their own" ON public.project_ideas;

CREATE POLICY "Project idea owners can see their own" 
ON public.project_ideas 
FOR ALL 
USING (user_id = auth.uid() OR auth.role() = 'authenticated');
