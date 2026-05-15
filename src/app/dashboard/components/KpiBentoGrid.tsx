import React from 'react';
import KpiCard from './KpiCard';
import { TrendingUp, Target, Trophy, AlertTriangle, BarChart2, Flame } from 'lucide-react';

// Grid plan: 6 cards → grid-cols-4
// Row 1: Total PnL (hero, spans 2 cols) + Win Rate + Avg RR Ratio
// Row 2: Current Streak + Best Trade + Discipline Score (warning state)

export default function KpiBentoGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {/* Hero: Total PnL — spans 2 cols */}
      <div className="sm:col-span-2 lg:col-span-2">
        <KpiCard
          id="kpi-total-pnl"
          label="Total P&L (This Month)"
          value="+$4,287.50"
          subtext="vs. $3,190 last month (+34.4%)"
          trend="up"
          trendValue="+34.4%"
          icon={<TrendingUp size={20} />}
          variant="profit"
          isHero
        />
      </div>

      {/* Win Rate */}
      <div>
        <KpiCard
          id="kpi-win-rate"
          label="Win Rate"
          value="64.2%"
          subtext="38 wins / 21 losses"
          trend="up"
          trendValue="+3.1%"
          icon={<Target size={18} />}
          variant="info"
        />
      </div>

      {/* Avg RR Ratio */}
      <div>
        <KpiCard
          id="kpi-rr-ratio"
          label="Avg RR Ratio"
          value="1.87"
          subtext="Target: 2.0 — close"
          trend="neutral"
          trendValue="–"
          icon={<BarChart2 size={18} />}
          variant="neutral"
        />
      </div>

      {/* Current Streak */}
      <div>
        <KpiCard
          id="kpi-streak"
          label="Current Streak"
          value="W5"
          subtext="5 consecutive wins"
          trend="up"
          trendValue="Hot streak"
          icon={<Flame size={18} />}
          variant="profit"
        />
      </div>

      {/* Best Trade */}
      <div>
        <KpiCard
          id="kpi-best-trade"
          label="Best Trade"
          value="+$1,240"
          subtext="BTC/USDT — Breakout Long"
          trend="up"
          trendValue="May 8, 2026"
          icon={<Trophy size={18} />}
          variant="profit"
        />
      </div>

      {/* Discipline Score — Warning state */}
      <div className="sm:col-span-2">
        <KpiCard
          id="kpi-discipline"
          label="Discipline Score"
          value="61 / 100"
          subtext="3 revenge trades detected this week — review AI Coach"
          trend="down"
          trendValue="–8 pts this week"
          icon={<AlertTriangle size={18} />}
          variant="warning"
          isAlert
        />
      </div>
    </div>
  );
}
