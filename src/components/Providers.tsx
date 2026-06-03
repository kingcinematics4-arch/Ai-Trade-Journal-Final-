'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TradesProvider } from '@/contexts/TradesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import ToastProvider from '@/components/ui/ToastProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
