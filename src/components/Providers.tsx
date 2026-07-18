'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TradesProvider } from '@/contexts/TradesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import ToastProvider from '@/components/ui/ToastProvider';
import { I18nProvider } from '@/i18n/provider/I18nProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationsProvider>
            <TradesProvider>
              <ToastProvider />
              {children}
            </TradesProvider>
          </NotificationsProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
