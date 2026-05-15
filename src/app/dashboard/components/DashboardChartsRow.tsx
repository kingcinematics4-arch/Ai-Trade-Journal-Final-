'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';

const PnlTrendChart = dynamic(() => import('./PnlTrendChart'), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

const MarketDistributionChart = dynamic(() => import('./MarketDistributionChart'), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

export default function DashboardChartsRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">P&L Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily profit/loss over the last 30 days
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
              Profit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
              Loss
            </span>
          </div>
        </div>
        <PnlTrendChart />
      </div>

      <div className="card-elevated p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Market Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Trade distribution by asset class</p>
        </div>
        <MarketDistributionChart />
      </div>
    </div>
  );
}
