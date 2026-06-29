'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import { useTranslation } from '@/i18n/hooks/useTranslation';

const PnlTrendChart = dynamic(() => import('./PnlTrendChart'), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

const MarketDistributionChart = dynamic(() => import('./MarketDistributionChart'), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

export default function DashboardChartsRow() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
      <div className="lg:col-span-2 card-premium p-6 min-w-0">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-foreground">
              {t('dashboard.charts.pnlTrend')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('dashboard.charts.equityCurve')}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              {t('dashboard.charts.profit')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              {t('dashboard.charts.loss')}
            </span>
          </div>
        </div>
        <PnlTrendChart />
      </div>

      <div className="card-premium p-6 min-w-0">
        <div className="mb-2 sm:mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            {t('dashboard.charts.marketBreakdown')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('dashboard.charts.byAssetClass')}
          </p>
        </div>
        <MarketDistributionChart />
      </div>
    </div>
  );
}
