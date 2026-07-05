-- ============================================================
-- PROFILES TABLE MIGRATION
-- ============================================================

-- Enable extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT,
  full_name       TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  phone           TEXT,
  country         TEXT,
  website         TEXT,
  twitter         TEXT,
  instagram       TEXT,
  linkedin        TEXT,
  public_profile  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on new auth user signup
-- NOTE: Only insert columns that exist at this point (trading_style added later via community_schema.sql)
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
    -- Generate a default username from email local-part
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- AVATARS STORAGE BUCKET
-- ============================================================

-- Create storage bucket for avatars (run if bucket doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage: anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Storage: authenticated users can manage their own avatars (All actions)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own avatars" ON storage.objects;

CREATE POLICY "Users can manage their own avatars"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars' AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT OR
      (regexp_split_to_array(name, '/'))[1] = auth.uid()::TEXT OR
      name LIKE (auth.uid()::TEXT || '/%')
    )
  )
  WITH CHECK (
    bucket_id = 'avatars' AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT OR
      (regexp_split_to_array(name, '/'))[1] = auth.uid()::TEXT OR
      name LIKE (auth.uid()::TEXT || '/%')
    )
  );

-- ============================================================
-- BACKFILL existing auth users (optional, run once)
-- ============================================================
INSERT INTO public.profiles (id, full_name, avatar_url, username)
SELECT
  au.id,
  au.raw_user_meta_data ->> 'full_name',
  au.raw_user_meta_data ->> 'avatar_url',
  LOWER(REGEXP_REPLACE(SPLIT_PART(au.email, '@', 1), '[^a-z0-9_]', '', 'g'))
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);