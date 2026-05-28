import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from './components/DashboardHeader';
import KpiBentoGrid from './components/KpiBentoGrid';
import DashboardChartsRow from './components/DashboardChartsRow';
import RecentTradesTable from './components/RecentTradesTable';
import AiInsightCard from './components/AiInsightCard';
import GoalsMiniPanel from './components/GoalsMiniPanel';
import { TradesProvider } from '@/contexts/TradesContext';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout activePath="/dashboard">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
            <DashboardHeader />
            <KpiBentoGrid />
            <DashboardChartsRow />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <RecentTradesTable />
              </div>
              <div className="space-y-4">
                <AiInsightCard />
                <GoalsMiniPanel />
              </div>
            </div>
          </div>
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
