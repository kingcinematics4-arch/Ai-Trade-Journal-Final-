import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SocialLinks from '@/components/profile/SocialLinks';
import { ProfilePageSkeleton } from '@/components/profile/ProfileSkeleton';
import { TradesProvider } from '@/contexts/TradesContext';
import ProfileContent from './ProfileContent';

export const metadata = {
  title: 'Profile — AITradeJournal',
  description: 'View and manage your trader profile, avatar, account settings and privacy.',
};

export default function ProfilePage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout>
          <ProfileContent />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
