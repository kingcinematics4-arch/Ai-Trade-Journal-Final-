'use client';

import React, { useMemo } from 'react';
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

/* ── Tooltip ────────────────────────────────────────────── */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PnlTrendPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const isStart = point.tradeNumber === 0;

  return (
    <div className="card-elevated shadow-xl p-3 text-xs min-w-[160px]">
      <p className="text-muted-foreground font-medium mb-2">
        {isStart ? 'Starting Point' : `Trade #${point.tradeNumber} — ${point.date}`}
      </p>
      <div className="space-y-1">
        {!isStart && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trade P&L</span>
            <span
              className={`font-semibold font-tabular ${point.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {point.pnl >= 0 ? '+' : ''}₹
              {Math.abs(point.pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div
          className={`flex justify-between gap-4 ${!isStart ? 'border-t border-border/50 pt-1 mt-1' : ''}`}
        >
          <span className="text-muted-foreground">Equity</span>
          <span
            className={`font-semibold font-tabular ${point.cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {point.cumulative >= 0 ? '+' : ''}₹
            {Math.abs(point.cumulative).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Chart ──────────────────────────────────────────────── */
export default function PnlTrendChart() {
  const { analytics, isLoading, isEmpty } = useTrades();

  const pnlData: PnlTrendPoint[] = analytics.pnlTrend;

  // Determine overall color: green if final equity >= 0, red if negative
  const overallPositive = useMemo(() => {
    if (pnlData.length === 0) return true;
    return pnlData[pnlData.length - 1].cumulative >= 0;
  }, [pnlData]);

  const lineColor = overallPositive ? '#22c55e' : '#ef4444';
  const gradientId = 'equityGradient';

  if (isLoading) {
    return <ChartSkeleton height={240} />;
  }

  if (isEmpty || pnlData.length === 0) {
    return (
      <EmptyState
        icon={<LineChart size={24} />}
        title="No P&L trend yet"
        description="Your cumulative equity curve will appear here after you log trades."
        actionLabel="Add a trade"
        actionHref="/add-trade"
        className="py-8"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={pnlData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
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
          tickFormatter={(v: number) =>
            `₹${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={lineColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
