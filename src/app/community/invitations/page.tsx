import React from 'react';
import CommunityHeader from '../components/CommunityHeader';
import EmptyState from '../components/EmptyState';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invitations - Community',
};

export default function InvitationsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-[80vh] flex flex-col">
      <CommunityHeader
        title="Invitations"
        subtitle="Pending connection requests from other traders."
      />

      <div className="flex-1 flex items-center justify-center">
        <EmptyState type="invitations" />
      </div>
    </div>
  );
}
