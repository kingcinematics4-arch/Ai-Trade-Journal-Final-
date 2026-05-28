import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { TradesProvider } from '@/contexts/TradesContext';
import TradeHistoryView from './components/TradeHistoryView';

export default function TradeHistoryPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout activePath="/trade-history">
          <TradeHistoryView />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
