'use client';

import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import AccountSettings from '@/components/profile/AccountSettings';
import DangerZone from '@/components/profile/DangerZone';

/**
 * SettingsPage
 * Control panel for the application.
 */
export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppLayout activePath="/settings">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">App Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure your experience, security, and notification preferences.
            </p>
          </div>

          <AccountSettings />

          <DangerZone />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
