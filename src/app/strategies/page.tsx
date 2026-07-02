import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { TradesProvider } from '@/contexts/TradesContext';
import StrategiesView from './components/StrategiesView';

export default function StrategiesPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout>
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
            <StrategiesView />
          </div>
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
