import React from 'react';
import CommunityHeader from '../components/CommunityHeader';
import SearchBar from '../components/SearchBar';
import TraderCard from '../components/TraderCard';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase';
import { mapDbProfile } from '@/types/profile';
import type { DbProfile, Profile } from '@/types/profile';

export const metadata: Metadata = {
  title: 'Discover Traders - Community',
};

export default async function DiscoverPage() {
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('public_profile', true)
    .order('updated_at', { ascending: false });

  const traders: Profile[] = (profiles ?? []).map((p) => mapDbProfile(p as DbProfile));

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <CommunityHeader 
        title="Discover Traders" 
        subtitle="Find and connect with top performing traders in the community." 
      />
      <SearchBar />
      
      {traders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="h-24 w-24 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-12 h-12 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">No public traders yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
            When traders enable their public profile, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {traders.map(trader => (
            <TraderCard key={trader.id} trader={trader} />
          ))}
        </div>
      )}
    </div>
  );
}