'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TradesProvider } from '@/contexts/TradesContext';
import { NotificationsProvider, useNotifications } from '@/contexts/NotificationsContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import ToastProvider from '@/components/ui/ToastProvider';
import { I18nProvider } from '@/i18n/provider/I18nProvider';
import NotificationDetailsPanel from '@/components/NotificationDetailsPanel';

function NotificationDetailsHost() {
  const { selectedNotification, closeSelected, deleteNotification } = useNotifications();

  return (
    <NotificationDetailsPanel
      notification={selectedNotification}
      onClose={closeSelected}
      onDelete={(id) => void deleteNotification(id)}
    />
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationsProvider>
            <TradesProvider>
              <ToastProvider />
              {children}
              <NotificationDetailsHost />
            </TradesProvider>
          </NotificationsProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
