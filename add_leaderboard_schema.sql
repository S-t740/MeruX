-- ==========================================
-- LEADERBOARD & REPUTATION SYSTEM FIX
-- Fixes column names to match frontend code
-- ==========================================

-- The table already exists from phase3 schema with columns: total_score, rank_title
-- The frontend code expects: score, rank_tier
-- Rename the columns to match

ALTER TABLE public.user_reputation 
  RENAME COLUMN total_score TO score;

ALTER TABLE public.user_reputation 
  RENAME COLUMN rank_title TO rank_tier;

-- Add 'reason' column to reputation_events if it has 'event_type' instead
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reputation_events' AND column_name = 'event_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reputation_events' AND column_name = 'reason'
  ) THEN
    ALTER TABLE public.reputation_events RENAME COLUMN event_type TO reason;
  END IF;
END $$;

-- ==========================================
-- Ensure RLS is set up correctly
-- ==========================================
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read user reputation" ON public.user_reputation;
CREATE POLICY "Anyone can read user reputation" ON public.user_reputation FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can manage reputation" ON public.user_reputation;
CREATE POLICY "Service can manage reputation" ON public.user_reputation FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can read reputation events" ON public.reputation_events;
CREATE POLICY "Anyone can read reputation events" ON public.reputation_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can insert reputation events" ON public.reputation_events;
CREATE POLICY "Service can insert reputation events" ON public.reputation_events FOR INSERT WITH CHECK (true);

-- ==========================================
-- SEED INITIAL REPUTATION DATA
-- Give every user a starting score based on their activity
-- ==========================================

-- Step 1: Ensure every profile has a reputation row (start at 0)
INSERT INTO public.user_reputation (user_id, score, rank_tier, updated_at)
SELECT id, 0, 'Observer', NOW()
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Award 50 pts per completed enrollment
UPDATE public.user_reputation ur
SET score = ur.score + sub.pts, updated_at = NOW()
FROM (
    SELECT user_id, COUNT(*) * 50 AS pts
    FROM public.enrollments
    WHERE status = 'completed'
    GROUP BY user_id
) sub
WHERE ur.user_id = sub.user_id;

-- Step 3: Award 10 pts per passed quiz (skip if table doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quiz_submissions') THEN
    EXECUTE '
      UPDATE public.user_reputation ur
      SET score = ur.score + sub.pts, updated_at = NOW()
      FROM (
          SELECT user_id, COUNT(*) * 10 AS pts
          FROM public.quiz_submissions
          WHERE passed = true
          GROUP BY user_id
      ) sub
      WHERE ur.user_id = sub.user_id';
  END IF;
END $$;

-- Step 4: Award 5 pts per badge (skip if table doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='badges') THEN
    EXECUTE '
      UPDATE public.user_reputation ur
      SET score = ur.score + sub.pts, updated_at = NOW()
      FROM (
          SELECT user_id, COUNT(*) * 5 AS pts
          FROM public.badges
          GROUP BY user_id
      ) sub
      WHERE ur.user_id = sub.user_id';
  END IF;
END $$;

-- Step 5: Update rank tiers based on final scores
UPDATE public.user_reputation SET rank_tier = 
    CASE
        WHEN score > 1000 THEN 'Master'
        WHEN score > 500  THEN 'Expert'
        WHEN score > 200  THEN 'Innovator'
        WHEN score > 50   THEN 'Contributor'
        ELSE 'Observer'
    END;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
