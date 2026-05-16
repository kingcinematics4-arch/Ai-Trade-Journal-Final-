-- Definitive Schema Synchronization for AI Trade Journal
-- This script ensures the Supabase 'trades' table matches the frontend expectations exactly.

-- 1. Ensure the table exists
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add/Correct Core Columns
DO $$ 
BEGIN
    -- Core Info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='trade_title') THEN
        ALTER TABLE public.trades ADD COLUMN trade_title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='trade_date') THEN
        ALTER TABLE public.trades ADD COLUMN trade_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='market_type') THEN
        ALTER TABLE public.trades ADD COLUMN market_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='asset_name') THEN
        ALTER TABLE public.trades ADD COLUMN asset_name TEXT NOT NULL DEFAULT 'Unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='trade_direction') THEN
        ALTER TABLE public.trades ADD COLUMN trade_direction TEXT NOT NULL DEFAULT 'buy';
    END IF;

    -- Execution & Performance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='entry_price') THEN
        ALTER TABLE public.trades ADD COLUMN entry_price NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='exit_price') THEN
        ALTER TABLE public.trades ADD COLUMN exit_price NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='stop_loss') THEN
        ALTER TABLE public.trades ADD COLUMN stop_loss NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='take_profit') THEN
        ALTER TABLE public.trades ADD COLUMN take_profit NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='lot_size') THEN
        ALTER TABLE public.trades ADD COLUMN lot_size NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='risk_amount') THEN
        ALTER TABLE public.trades ADD COLUMN risk_amount NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='pnl_amount') THEN
        ALTER TABLE public.trades ADD COLUMN pnl_amount NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='rr_ratio') THEN
        ALTER TABLE public.trades ADD COLUMN rr_ratio NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='trade_status') THEN
        ALTER TABLE public.trades ADD COLUMN trade_status TEXT DEFAULT 'breakeven';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='trade_duration') THEN
        ALTER TABLE public.trades ADD COLUMN trade_duration TEXT;
    END IF;

    -- Strategy & Psychology
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='strategy_used') THEN
        ALTER TABLE public.trades ADD COLUMN strategy_used TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='emotion_before') THEN
        ALTER TABLE public.trades ADD COLUMN emotion_before TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='emotion_after') THEN
        ALTER TABLE public.trades ADD COLUMN emotion_after TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='mistake_category') THEN
        ALTER TABLE public.trades ADD COLUMN mistake_category TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='lessons_learned') THEN
        ALTER TABLE public.trades ADD COLUMN lessons_learned TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='notes') THEN
        ALTER TABLE public.trades ADD COLUMN notes TEXT;
    END IF;

    -- Metadata & Media
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='tags') THEN
        ALTER TABLE public.trades ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='confidence_level') THEN
        ALTER TABLE public.trades ADD COLUMN confidence_level INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='trade_rating') THEN
        ALTER TABLE public.trades ADD COLUMN trade_rating INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='entry_images') THEN
        ALTER TABLE public.trades ADD COLUMN entry_images TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='exit_images') THEN
        ALTER TABLE public.trades ADD COLUMN exit_images TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='chart_images') THEN
        ALTER TABLE public.trades ADD COLUMN chart_images TEXT[] DEFAULT '{}';
    END IF;

END $$;

-- 3. Ensure RLS is active
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 4. Clean up old/redundant policies and create fresh ones
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
CREATE POLICY "Users can insert their own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
CREATE POLICY "Users can update their own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
CREATE POLICY "Users can delete their own trades" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS trades_user_id_idx ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS trades_trade_date_idx ON public.trades(trade_date DESC);
CREATE INDEX IF NOT EXISTS trades_created_at_idx ON public.trades(created_at DESC);
