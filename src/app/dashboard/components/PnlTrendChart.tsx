'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTrades } from '@/contexts/TradesContext';
import type { PnlTrendPoint } from '@/lib/trades/types';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { LineChart } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  
  // STEP 1 Compliance: type EquityPoint = { date, pnl, cumulative }
  const pnl = payload.find((p) => p.dataKey === 'pnl')?.value ?? 0;
  const cumulative = payload.find((p) => p.dataKey === 'cumulative')?.value ?? 0;
  
  return (
    <div className="card-elevated shadow-xl p-3 text-xs min-w-[140px]">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {label !== 'Start' && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Session P&L</span>
            <span className={`font-semibold font-tabular ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-border/50 pt-1 mt-1">
          <span className="text-muted-foreground">Equity Balance</span>
          <span className={`font-semibold font-tabular ${cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {cumulative >= 0 ? '+' : ''}${Math.abs(cumulative).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PnlTrendChart() {
  const { analytics, isLoading, isEmpty } = useTrades();
  
  // STEP 3 — FORCE chart to use ONLY the pipeline output (analytics.pnlTrend is buildEquityCurve output)
  const pnlData: PnlTrendPoint[] = analytics.pnlTrend;

  // STEP 5 — DEBUG CHECK
  if (pnlData.length > 0 && process.env.NODE_ENV === 'development') {
    console.log('[Chart Check] Rendering with data:', pnlData);
  }

  if (isLoading) {
    return <ChartSkeleton height={240} />;
  }

  if (isEmpty || pnlData.length === 0) {
    return (
      <EmptyState
        icon={<LineChart size={24} />}
        title="No P&L trend yet"
        description="Your cumulative profit curve will appear here after you log trades."
        actionLabel="Add a trade"
        actionHref="/add-trade"
        className="py-8"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={pnlData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--profit)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--profit)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
        {/* We keep pnl in data but only Area maps to cumulative */}
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#gradProfit)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
