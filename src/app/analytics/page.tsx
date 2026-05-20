import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import ToastProvider from '@/components/ui/ToastProvider';
import { TradesProvider } from '@/contexts/TradesContext';
import AnalyticsView from './components/AnalyticsView';

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout activePath="/analytics">
          <ToastProvider />
          <AnalyticsView />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
