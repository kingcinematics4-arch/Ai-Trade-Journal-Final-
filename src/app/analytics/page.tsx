import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { TradesProvider } from '@/contexts/TradesContext';
import AnalyticsView from './components/AnalyticsView';

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout activePath="/analytics">
          <AnalyticsView />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
