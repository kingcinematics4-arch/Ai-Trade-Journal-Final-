'use client';

import React from 'react';
import AccountSettings from '@/components/profile/AccountSettings';

/**
 * SettingsPage
 * Primary route for user account, security, and application preferences.
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your profile information, security settings, and notification preferences.
        </p>
      </div>

      <AccountSettings />
    </div>
  );
}