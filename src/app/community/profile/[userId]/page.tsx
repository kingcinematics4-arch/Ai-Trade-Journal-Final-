import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PublicProfileClient from './PublicProfileClient';
import { getPublicProfileById, getPublicProfileByUsername } from '@/services/communityService';

interface Props {
  params: { userId: string };
}

/** UUID v4 pattern — if the slug matches, treat it as an ID; otherwise treat as username */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a profile slug that may be either a UUID or a username.
 * TraderCard routes by username when one is set, and by UUID as fallback.
 */
async function resolveProfile(slug: string) {
  if (UUID_RE.test(slug)) {
    return getPublicProfileById(slug);
  }
  return getPublicProfileByUsername(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  let full_name: string | null = null;
  let username: string | null = null;

  if (UUID_RE.test(params.userId)) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', params.userId)
      .single();
    full_name = data?.full_name ?? null;
    username = data?.username ?? null;
  } else {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('username', params.userId)
      .single();
    full_name = data?.full_name ?? null;
    username = data?.username ?? null;
  }

  const name = full_name || username || 'Community Profile';
  return { title: `${name} - Community Profile` };
}

export default async function PublicProfilePage({ params }: Props) {
  const profile = await resolveProfile(params.userId);

  if (!profile) {
    const supabase = createClient();
    let exists = false;

    if (UUID_RE.test(params.userId)) {
      const { data, error } = await supabase
        .from('profiles').select('public_profile').eq('id', params.userId).single();
      exists = !error && !!data;
    } else {
      const { data, error } = await supabase
        .from('profiles').select('public_profile').eq('username', params.userId).single();
      exists = !error && !!data;
    }

    if (!exists) notFound();

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="h-20 w-20 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">This profile is private.</h1>
          <p className="text-muted-foreground text-sm">This trader has not enabled their public profile.</p>
        </div>
      </div>
    );
  }

  return <PublicProfileClient profile={profile} />;
}