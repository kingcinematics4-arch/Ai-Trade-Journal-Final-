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
  const pnl = payload.find((p) => p.dataKey === 'pnl')?.value ?? 0;
  const cumulative = payload.find((p) => p.dataKey === 'cumulative')?.value ?? 0;
  return (
    <div className="card-elevated shadow-xl p-3 text-xs min-w-[140px]">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Session P&L</span>
          <span className={`font-semibold font-tabular ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}
            {pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cumulative</span>
          <span className={`font-semibold font-tabular ${cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {cumulative >= 0 ? '+' : ''}${cumulative.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PnlTrendChart() {
  const { analytics, isLoading, isEmpty } = useTrades();
  const pnlData: PnlTrendPoint[] = analytics.pnlTrend;

  // RULE 6 — CHART INPUT CONTRACT (HARD RULE)
  if (pnlData.length > 0) {
    pnlData.forEach((point) => {
      if (typeof point.cumulative !== 'number' || isNaN(point.cumulative)) {
        console.error('[Chart Error] Invalid point:', point);
        throw new Error(
          `CHART CONTRACT VIOLATION: Cumulative P&L at ${point.date} is not a number. Received: ${typeof point.cumulative}`,
        );
      }
    });
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
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
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
