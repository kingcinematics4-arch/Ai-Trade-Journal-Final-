import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from './components/DashboardHeader';
import KpiBentoGrid from './components/KpiBentoGrid';
import DashboardChartsRow from './components/DashboardChartsRow';
import RecentTradesTable from './components/RecentTradesTable';
import AiInsightCard from './components/AiInsightCard';
import GoalsMiniPanel from './components/GoalsMiniPanel';
import ToastProvider from '@/components/ui/ToastProvider';

export default function DashboardPage() {
  return (
    <AppLayout activePath="/dashboard">
      <ToastProvider />
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
  );
}