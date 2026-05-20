import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import ToastProvider from '@/components/ui/ToastProvider';
import { TradesProvider } from '@/contexts/TradesContext';
import TradeHistoryView from './components/TradeHistoryView';

export default function TradeHistoryPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout activePath="/trade-history">
          <ToastProvider />
          <TradeHistoryView />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
