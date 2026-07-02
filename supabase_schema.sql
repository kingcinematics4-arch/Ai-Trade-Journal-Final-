-- Create the trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Trade Info
    trade_title TEXT,
    trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
    market_type TEXT,
    asset_name TEXT NOT NULL,
    trade_direction TEXT NOT NULL, -- 'buy' or 'sell'
    
    -- Execution Details
    entry_price NUMERIC,
    exit_price NUMERIC,
    stop_loss NUMERIC,
    take_profit NUMERIC,
    lot_size NUMERIC,
    risk_amount NUMERIC,
    trade_duration TEXT,
    
    -- Performance
    pnl_amount NUMERIC,
    rr_ratio NUMERIC,
    trade_status TEXT, -- 'win', 'loss', 'breakeven'
    
    -- Psychology & Strategy
    strategy_used TEXT,
    emotion_before TEXT,
    emotion_after TEXT,
    mistake_category TEXT,
    lessons_learned TEXT,
    notes TEXT,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    confidence_level INTEGER,
    trade_rating INTEGER,
    
    -- Media (Public URLs from Supabase Storage)
    entry_images TEXT[] DEFAULT '{}',
    exit_images TEXT[] DEFAULT '{}',
    chart_images TEXT[] DEFAULT '{}'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own trades" 
    ON public.trades FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" 
    ON public.trades FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
    ON public.trades FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
    ON public.trades FOR DELETE 
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS trades_user_id_idx ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS trades_trade_date_idx ON public.trades(trade_date DESC);
CREATE INDEX IF NOT EXISTS trades_created_at_idx ON public.trades(created_at DESC);

-- ==========================================
-- STORAGE CONFIGURATION
-- ==========================================

-- Create storage bucket for trade media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trade-media', 'trade-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for authenticated users
-- Note: We use the first part of the path as the user_id for isolation

DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
CREATE POLICY "Give users access to own folder" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'trade-media' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (regexp_split_to_array(name, '/'))[1] = auth.uid()::text OR
    name LIKE (auth.uid()::text || '/%')
  )
)
WITH CHECK (
  bucket_id = 'trade-media' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (regexp_split_to_array(name, '/'))[1] = auth.uid()::text OR
    name LIKE (auth.uid()::text || '/%')
  )
);

DROP POLICY IF EXISTS "Allow public read access to media" ON storage.objects;
CREATE POLICY "Allow public read access to media" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'trade-media');
