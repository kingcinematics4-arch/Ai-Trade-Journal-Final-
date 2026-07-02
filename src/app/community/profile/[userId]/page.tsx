import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PublicProfileClient from './PublicProfileClient';
import type { DbProfile } from '@/types/profile';
import type { PublicTraderProfile } from '@/types/community';
import { getPublicProfileById } from '@/services/communityService';

interface Props {
  params: { userId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', params.userId)
    .single();

  const name = data?.full_name || data?.username || 'Community Profile';
  return {
    title: `${name} - Community Profile`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  // Fetch the public profile with trade stats from the service
  const profile = await getPublicProfileById(params.userId);

  if (!profile) {
    // Profile doesn't exist, is private, or error occurred
    // Try to check if profile exists at all to differentiate
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('public_profile')
      .eq('id', params.userId)
      .single();

    const exists = !error && !!data;

    if (!exists) {
      notFound();
    }

    // Profile exists but is private
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="h-20 w-20 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">This profile is private.</h1>
          <p className="text-muted-foreground text-sm">
            This trader has not enabled their public profile.
          </p>
        </div>
      </div>
    );
  }

  return <PublicProfileClient profile={profile} />;
}