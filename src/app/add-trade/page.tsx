import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import AddTradeHeader from './components/AddTradeHeader';
import AddTradeForm from './components/AddTradeForm';
import ToastProvider from '@/components/ui/ToastProvider';

export default function AddTradePage() {
  return (
    <AuthGuard>
      <AppLayout activePath="/add-trade">
        <ToastProvider />
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
          <AddTradeHeader />
          <AddTradeForm />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
