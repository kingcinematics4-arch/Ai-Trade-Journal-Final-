-- ============================================================
-- FIX MISSING PROFILES COLUMNS
-- ============================================================
-- Run this in the Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Add missing columns that were lost or never applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN website TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'twitter'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN twitter TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN instagram TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin TEXT;
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
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trading_style'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trading_style TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_stats'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN show_stats BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 2. Recreate the auth trigger to properly copy metadata into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, country)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g')),
    NEW.raw_user_meta_data ->> 'country'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure RLS policies exist for INSERT and UPDATE
-- These are critical for profile saving to work!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Update the SELECT policy for community
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are viewable by owner or if public'
  ) THEN
    DROP POLICY "Profiles are viewable by owner or if public" ON public.profiles;
  END IF;

  CREATE POLICY "Profiles are viewable by owner or if public"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id 
      OR public_profile = true
    );
END $$;

-- 4. Backfill existing profiles from auth metadata where fields are missing.
UPDATE public.profiles p
SET 
  full_name = COALESCE(p.full_name, au.raw_user_meta_data ->> 'full_name'),
  avatar_url = COALESCE(p.avatar_url, au.raw_user_meta_data ->> 'avatar_url'),
  username = COALESCE(p.username, LOWER(REGEXP_REPLACE(SPLIT_PART(au.email, '@', 1), '[^a-z0-9_]', '', 'g'))),
  country = COALESCE(p.country, au.raw_user_meta_data ->> 'country'),
  trading_style = COALESCE(p.trading_style, au.raw_user_meta_data ->> 'trading_style')
FROM auth.users au
WHERE p.id = au.id
  AND (
    p.full_name IS NULL 
    OR p.avatar_url IS NULL 
    OR p.username IS NULL 
    OR p.country IS NULL 
    OR p.trading_style IS NULL
  );

-- 5. Verify column existence
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
ORDER BY ordinal_position;