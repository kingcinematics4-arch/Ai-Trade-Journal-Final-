'use client';
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// BACKEND: GET /api/analytics/market-distribution — replace with real data
const marketData = [
  { id: 'mkt-crypto', name: 'Crypto', value: 42, trades: 25, pnl: 2140 },
  { id: 'mkt-forex', name: 'Forex', value: 31, trades: 18, pnl: 1180 },
  { id: 'mkt-stocks', name: 'Stocks', value: 18, trades: 11, pnl: 720 },
  { id: 'mkt-futures', name: 'Futures', value: 9, trades: 5, pnl: 247 },
];

const COLORS = ['var(--primary)', 'var(--accent)', '#f59e0b', '#8b5cf6'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: (typeof marketData)[0] }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="card-elevated shadow-xl p-3 text-xs min-w-[130px]">
      <p className="font-semibold text-foreground mb-1.5">{d.name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Share</span>
          <span className="font-tabular text-foreground">{d.value}%</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Trades</span>
          <span className="font-tabular text-foreground">{d.trades}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">P&L</span>
          <span className="font-tabular text-green-400">+${d.pnl.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketDistributionChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={marketData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {marketData.map((entry, index) => (
              <Cell
                key={entry.id}
                fill={COLORS[index % COLORS.length]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        {marketData.map((d, i) => (
          <div key={d.id} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground truncate">{d.name}</span>
            <span className="text-xs font-tabular font-medium text-foreground ml-auto">
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
