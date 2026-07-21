-- ========================================================
-- Profile Likes Table (run in Supabase SQL editor)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.profile_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_profile_user_like UNIQUE (profile_id, user_id)
);

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read likes
DROP POLICY IF EXISTS "Authenticated users can read profile_likes" ON public.profile_likes;
CREATE POLICY "Authenticated users can read profile_likes"
    ON public.profile_likes FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own likes
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.profile_likes;
CREATE POLICY "Users can insert their own likes"
    ON public.profile_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own likes
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.profile_likes;
CREATE POLICY "Users can delete their own likes"
    ON public.profile_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS profile_likes_profile_id_idx ON public.profile_likes(profile_id);
CREATE INDEX IF NOT EXISTS profile_likes_user_id_idx ON public.profile_likes(user_id);
CREATE INDEX IF NOT EXISTS profile_likes_profile_user_idx ON public.profile_likes(profile_id, user_id);

-- Enable realtime for live updates
ALTER TABLE public.profile_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'profile_likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_likes;
    END IF;
END $$;