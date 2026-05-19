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
    <div className="card-elevated shadow-xl p-3 text-xs min-w-[180px] border border-border/50 rounded-md bg-background/95 backdrop-blur">
      <p className="text-muted-foreground font-medium mb-2 pb-2 border-b border-border/50">
        {isStart ? 'Starting Point' : `Trade #${point.tradeNumber} — ${point.date}`}
      </p>
      
      {!isStart && point.asset && point.asset !== '—' && (
        <div className="flex justify-between gap-4 mb-1">
          <span className="text-muted-foreground">Asset</span>
          <span className="font-medium">{point.asset}</span>
        </div>
      )}

      {!isStart && (
        <div className="flex justify-between gap-4 mb-1">
          <span className="text-muted-foreground">Trade P&L</span>
          <span
            className={`font-semibold font-tabular ${point.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {point.pnl >= 0 ? '+' : '-'}$
            {Math.abs(point.pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className={`flex justify-between gap-4 ${!isStart ? 'pt-1 mt-1 border-t border-border/50' : ''}`}>
        <span className="text-muted-foreground font-medium">Running Equity</span>
        <span
          className={`font-bold font-tabular ${point.cumulative >= 0 ? 'text-green-500' : 'text-red-500'}`}
        >
          {point.cumulative >= 0 ? '+' : '-'}$
          {Math.abs(point.cumulative).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

/* ── Chart ──────────────────────────────────────────────── */
export default function PnlTrendChart() {
  const { analytics, isLoading, isEmpty } = useTrades();

  const pnlData: PnlTrendPoint[] = analytics.pnlTrend;

  // Calculate the split percentage for the gradient (0 is where we shift from green to red)
  const gradientOffset = useMemo(() => {
    if (!pnlData || pnlData.length === 0) return 0;
    
    const dataMax = Math.max(...pnlData.map((i) => i.cumulative));
    const dataMin = Math.min(...pnlData.map((i) => i.cumulative));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  }, [pnlData]);

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

  const off = gradientOffset;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={pnlData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor="#22c55e" stopOpacity={1} />
            <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
          </linearGradient>
          <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor="#22c55e" stopOpacity={0.2} />
            <stop offset={off} stopColor="#ef4444" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
        <XAxis
          dataKey="tradeNumber"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          dy={10}
          tickFormatter={(val) => {
            const point = pnlData.find((p) => p.tradeNumber === val);
            return point && point.tradeNumber !== 0 ? point.date : '';
          }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
          }
          dx={-10}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity={0.5} />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="url(#splitColor)"
          strokeWidth={3}
          fill="url(#splitFill)"
          dot={false}
          activeDot={{
            r: 5,
            fill: 'var(--background)',
            stroke: 'url(#splitColor)',
            strokeWidth: 2,
          }}
          animationDuration={1500}
          animationEasing="ease-in-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
