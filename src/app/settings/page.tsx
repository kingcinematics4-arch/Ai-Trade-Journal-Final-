'use client';

import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import AccountSettings from '@/components/profile/AccountSettings';
import DangerZone from '@/components/profile/DangerZone';
import { useTranslation } from '@/i18n/hooks/useTranslation';

/**
 * SettingsPage
 * Control panel for the application.
 */
export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('settings.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('settings.subtitle')}
            </p>
          </div>

          <AccountSettings />

          <DangerZone />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
