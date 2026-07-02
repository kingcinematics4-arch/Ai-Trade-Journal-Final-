import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { TradesProvider } from '@/contexts/TradesContext';
import AnalyticsView from './components/AnalyticsView';

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout>
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
            <AnalyticsView />
          </div>
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
