-- ========================================================
-- NOTIFICATIONS TABLE MIGRATION
-- ========================================================

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('trade', 'system', 'achievement', 'warning', 'analytics', 'ai', 'admin')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Enable users to SELECT their own notifications
CREATE POLICY "Users can select their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Enable users to UPDATE their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Enable users to DELETE their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Enable insertion of notifications (useful if notifications are created directly via client actions)
CREATE POLICY "Users can insert notifications for themselves"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON public.notifications(user_id, is_read);

-- 5. Enable Realtime Replication
-- Add the notifications table to the supabase_realtime publication to enable postgres_changes listening
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
