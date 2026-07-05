import React from 'react';
import CommunityHeader from '../components/CommunityHeader';
import EmptyState from '../components/EmptyState';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Network - Community',
};

export default function NetworkPage() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-[80vh] flex flex-col">
      <CommunityHeader title="My Network" subtitle="Manage your connections and trading network." />

      <div className="flex-1 flex items-center justify-center">
        <EmptyState type="network" />
      </div>
    </div>
  );
}
