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

// BACKEND: GET /api/analytics/pnl-trend?timeframe=month — replace with real data
const pnlData = [
  { date: 'Apr 12', pnl: 180, cumulative: 180 },
  { date: 'Apr 14', pnl: -95, cumulative: 85 },
  { date: 'Apr 16', pnl: 340, cumulative: 425 },
  { date: 'Apr 18', pnl: -210, cumulative: 215 },
  { date: 'Apr 20', pnl: 520, cumulative: 735 },
  { date: 'Apr 22', pnl: 110, cumulative: 845 },
  { date: 'Apr 24', pnl: -180, cumulative: 665 },
  { date: 'Apr 26', pnl: 290, cumulative: 955 },
  { date: 'Apr 28', pnl: 450, cumulative: 1405 },
  { date: 'Apr 30', pnl: -120, cumulative: 1285 },
  { date: 'May 2', pnl: 380, cumulative: 1665 },
  { date: 'May 4', pnl: 240, cumulative: 1905 },
  { date: 'May 6', pnl: -310, cumulative: 1595 },
  { date: 'May 8', pnl: 1240, cumulative: 2835 },
  { date: 'May 10', pnl: 680, cumulative: 3515 },
  { date: 'May 11', pnl: 772, cumulative: 4287 },
];

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
          <span
            className={`font-semibold font-tabular ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {pnl >= 0 ? '+' : ''}
            {pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cumulative</span>
          <span
            className={`font-semibold font-tabular ${cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {cumulative >= 0 ? '+' : ''}${cumulative.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PnlTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={pnlData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--profit)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--profit)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradLoss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--loss)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--loss)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          interval={2}
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
