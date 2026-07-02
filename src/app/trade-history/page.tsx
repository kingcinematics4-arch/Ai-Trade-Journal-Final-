import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { TradesProvider } from '@/contexts/TradesContext';
import TradeHistoryView from './components/TradeHistoryView';

export default function TradeHistoryPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout>
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
            <TradeHistoryView />
          </div>
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
