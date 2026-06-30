import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SocialLinks from '@/components/profile/SocialLinks';
import { ProfilePageSkeleton } from '@/components/profile/ProfileSkeleton';
import { TradesProvider } from '@/contexts/TradesContext';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export const metadata = {
  title: 'Profile — AITradeJournal',
  description: 'View and manage your trader profile, avatar, account settings and privacy.',
};

export default function ProfilePage() {
  const { t } = useTranslation();

  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-5">
            {/* Page heading (visible on mobile only) */}
            <div className="lg:hidden">
              <h1 className="text-xl font-bold text-foreground">{t('profile.mobileTitle')}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('profile.mobileSubtitle')}
              </p>
            </div>

            {/* Profile header with avatar + stats */}
            <ProfileHeader />

            {/* Social links */}
            <div className="rounded-2xl border border-white/[0.07] bg-card/30 backdrop-blur-md overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <h2 className="text-sm font-bold text-foreground">{t('profile.socialLinks')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('profile.socialLinksSubtitle')}
                </p>
              </div>
              <div className="p-6">
                <SocialLinks />
              </div>
            </div>
          </div>
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
