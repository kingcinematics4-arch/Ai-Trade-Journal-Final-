'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TradesProvider } from '@/contexts/TradesContext';
import ToastProvider from '@/components/ui/ToastProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TradesProvider>
        <ToastProvider />
        {children}
      </TradesProvider>
    </AuthProvider>
  );
}
