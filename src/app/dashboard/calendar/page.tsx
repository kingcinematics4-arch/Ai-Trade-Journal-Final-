'use client';

import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import CalendarView from '@/components/CalendarView';

export default function CalendarPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
          <CalendarView />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
