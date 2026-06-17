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
          <StrategiesView />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
