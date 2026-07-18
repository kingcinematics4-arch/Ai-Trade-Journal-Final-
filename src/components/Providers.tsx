'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TradesProvider } from '@/contexts/TradesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import ToastProvider from '@/components/ui/ToastProvider';
import { I18nProvider } from '@/i18n/provider/I18nProvider';
import AudioInit from '@/components/AudioInit';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationsProvider>
            <TradesProvider>
              <AudioInit />
              <ToastProvider />
              {children}
            </TradesProvider>
          </NotificationsProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
