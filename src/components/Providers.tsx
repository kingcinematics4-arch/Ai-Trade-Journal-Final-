'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TradesProvider } from '@/contexts/TradesContext';
import { NotificationsProvider, useNotifications } from '@/contexts/NotificationsContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import ToastProvider from '@/components/ui/ToastProvider';
import { I18nProvider } from '@/i18n/provider/I18nProvider';
import NotificationDetailsPanel from '@/components/NotificationDetailsPanel';
import { useRouter } from 'next/navigation';

function NotificationDetailsHost() {
  const router = useRouter();
  const {
    selectedNotification,
    closeSelected,
    markAsRead,
    markUnread,
    deleteNotification,
  } = useNotifications();

  return (
    <NotificationDetailsPanel
      notification={selectedNotification}
      onClose={closeSelected}
      onMarkRead={(id) => void markAsRead(id)}
      onMarkUnread={(id) => void markUnread(id)}
      onDelete={(id) => void deleteNotification(id)}
      onNavigate={(link) => router.push(link)}
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
