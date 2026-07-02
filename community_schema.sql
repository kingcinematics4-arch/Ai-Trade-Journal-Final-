-- ============================================================
-- COMMUNITY CONNECTIONS TABLE + RLS POLICIES
-- ============================================================

-- 1. Create connections table for community feature
CREATE TABLE IF NOT EXISTS public.connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON public.connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_connections_updated_at ON public.connections;
CREATE TRIGGER set_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Policies for connections
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests"
  ON public.connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they're involved in"
  ON public.connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- ============================================================
-- ADDITIONAL PROFILE FIELDS FOR COMMUNITY
-- ============================================================

-- Add community-specific fields to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trading_style'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trading_style TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'markets'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN markets TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'experience'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN experience TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_stats'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN show_stats BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- ============================================================
-- RLS POLICY: Allow community to see public profiles
-- ============================================================

-- Drop the restrictive "viewable by authenticated users" policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Create a policy that allows:
-- 1. Users to see their own profile
-- 2. Anyone (authenticated) to see profiles with public_profile = true
CREATE POLICY "Profiles are viewable by owner or if public"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR public_profile = true
  );

-- ============================================================
-- INDEX FOR PUBLIC PROFILE QUERIES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_public_profile ON public.profiles(public_profile) WHERE public_profile = true;