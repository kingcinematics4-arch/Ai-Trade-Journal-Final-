'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Clock,
  PieChart as PieIcon,
  Tag as TagIcon,
} from 'lucide-react';
import type { AdvancedAnalytics } from '@/lib/trades/analyticsEngine';
import type { PnlTrendPoint } from '@/lib/trades/types';
import { formatCurrency } from '@/lib/trades/analytics';

interface AnalyticsChartsGridProps {
  stats: AdvancedAnalytics;
}

export default function AnalyticsChartsGrid({ stats }: AnalyticsChartsGridProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'pnl' | 'time' | 'market'>('pnl');

  const tabOptions = [
    { id: 'pnl', label: t('analytics.charts.tabEquity'), icon: <TrendingUp size={13} /> },
    { id: 'time', label: t('analytics.charts.tabTime'), icon: <Calendar size={13} /> },
    { id: 'market', label: t('analytics.charts.tabMarket'), icon: <TagIcon size={13} /> },
  ] as const;

  const winLossData = [
    { name: 'Wins', value: stats.winCount, color: '#22c55e' },
    { name: 'Losses', value: stats.lossCount, color: '#ef4444' },
    { name: 'Breakevens', value: stats.breakevenCount, color: '#71717a' },
  ].filter((d) => d.value > 0);

  type TooltipPayloadItem = {
    value?: ValueType;
    name?: NameType;
    color?: string;
    fill?: string;
    stroke?: string;
    payload?: Record<string, unknown>;
  };

  type CustomTooltipProps = TooltipProps<ValueType, NameType> & {
    payload?: TooltipPayloadItem[];
    label?: string | number;
  };

  // Custom tooltips
  const CustomPnlTooltip = (props: CustomTooltipProps) => {
    const { active, payload, label } = props;

    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0];
    const data = item.payload as unknown as PnlTrendPoint;
    const isStart = data.tradeNumber === 0;
    const tradeNum =
      label !== undefined && label !== null && label !== '' ? label : data.tradeNumber;
    const title = isStart
      ? t('analytics.charts.tooltip.startingPoint')
      : t('analytics.charts.tooltip.tradeNumber', { number: tradeNum, date: data.date || '—' });
    const color =
      item.stroke && typeof item.stroke === 'string' && !item.stroke.includes('url')
        ? item.stroke
        : data.cumulative >= 0
          ? '#22c55e'
          : '#ef4444';

    return (
      <div className="card-elevated shadow-xl p-3 text-xs border border-border rounded-md bg-background/95 backdrop-blur z-50 min-w-[160px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-muted-foreground font-semibold truncate font-tabular">{title}</p>
        </div>

        {!isStart && data.asset && data.asset !== '—' && (
          <div className="flex justify-between gap-4 mb-1">
            <span className="text-muted-foreground">{t('analytics.charts.tooltip.asset')}</span>
            <span className="font-semibold text-foreground">{data.asset}</span>
          </div>
        )}

        {!isStart && (
          <div className="flex justify-between gap-4 mb-1">
            <span className="text-muted-foreground">
              {t('analytics.charts.tooltip.tradeReturn')}
            </span>
            <span
              className={`font-bold font-tabular ${(data.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {formatCurrency(data.pnl, { showSign: true })}
            </span>
          </div>
        )}
        <div
          className={`flex justify-between gap-4 ${!isStart ? 'border-t border-border/50 pt-1.5 mt-0.5' : ''}`}
        >
          <span className="text-muted-foreground">{t('analytics.charts.tooltip.accountPnl')}</span>
          <span
            className={`font-black font-tabular ${(data.cumulative || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {formatCurrency(data.cumulative, { showSign: true })}
          </span>
        </div>
      </div>
    );
  };

  const CustomBarTooltip = (props: CustomTooltipProps) => {
    const { active, payload, label } = props;

    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0];
    const data = item.payload as {
      day?: string;
      month?: string;
      pair?: string;
      strategy?: string;
      pnl: number;
      trades?: number;
      totalTrades?: number;
      tradesCount?: number;
    };
    const color = item.fill || item.stroke || item.color || 'var(--primary)';

    const title =
      label !== undefined && label !== null && label !== ''
        ? String(label)
        : data.day || data.month || data.pair || data.strategy || 'Performance';

    const val = typeof item.value === 'number' ? item.value : Number(item.value ?? data.pnl ?? 0);

    return (
      <div className="card-elevated shadow-xl p-3 text-xs border border-border rounded-md bg-background/95 backdrop-blur z-50 min-w-[150px]">
        <div className="flex items-center gap-2 mb-2 border-b border-border/50 pb-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-muted-foreground font-bold truncate font-tabular">{title}</p>
        </div>
        <div className="flex justify-between gap-4 mb-1">
          <span className="text-muted-foreground">{t('analytics.charts.tooltip.performance')}</span>
          <span
            className={`font-bold font-tabular ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {formatCurrency(val, { showSign: true })}
          </span>
        </div>
        {(data.trades !== undefined ||
          data.totalTrades !== undefined ||
          data.tradesCount !== undefined) && (
          <div className="flex justify-between gap-4 mt-1">
            <span className="text-muted-foreground">
              {t('analytics.charts.tooltip.tradesLogged')}
            </span>
            <span className="font-semibold text-foreground font-tabular">
              {data.trades ?? data.totalTrades ?? data.tradesCount}
            </span>
          </div>
        )}
      </div>
    );
  };

  interface WinLossPieData {
    name: string;
    value: number;
    color: string;
  }

  const CustomPieTooltip = (props: CustomTooltipProps) => {
    const { active, payload, label } = props;

    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0];
    const data = item.payload as unknown as WinLossPieData;
    const total = stats.winCount + stats.lossCount + stats.breakevenCount;
    const value = Number(item.value ?? data.value ?? 0);
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
      <div className="card-elevated shadow-xl p-3 text-xs border border-border rounded-md bg-background/95 backdrop-blur z-50 min-w-[140px]">
        <div className="flex items-center gap-2 mb-2 border-b border-border/50 pb-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.fill || item.color || item.stroke || data.color }}
          />
          <p className="text-muted-foreground font-semibold">{data.name}</p>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t('analytics.charts.tooltip.occurrences')}</span>
          <span className="font-bold text-foreground font-tabular">
            {value}
            {t('analytics.charts.tooltip.tradesSuffix')}
          </span>
        </div>
        <div className="flex justify-between gap-4 mt-1">
          <span className="text-muted-foreground">
            {t('analytics.charts.tooltip.distribution')}
          </span>
          <span className="font-bold text-foreground font-tabular">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="card-elevated p-6 space-y-6">
      {/* Dynamic Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{t('analytics.charts.title')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('analytics.charts.description')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-lg border border-border self-start overflow-x-auto max-w-full scrollbar-none no-scrollbar">
          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-500'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs panels containing charts */}
      <div className="w-full min-h-[350px]">
        <AnimatePresence mode="wait">
          {activeTab === 'pnl' && (
            <motion.div
              key="panel-pnl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Equity curve */}
              <div className="lg:col-span-2 space-y-2 order-2 lg:order-1">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('analytics.charts.equityGrowth')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t('analytics.charts.equityGrowthDesc')}
                  </p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.equityCurve}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="tradeNumber"
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        tickFormatter={(val) => {
                          const point = stats.equityCurve.find((p) => p.tradeNumber === val);
                          return point && point.tradeNumber !== 0 ? point.date : '';
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        dx={-8}
                        tickFormatter={(v: number) =>
                          `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                        }
                      />
                      <Tooltip content={<CustomPnlTooltip />} />
                      <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#growthGradient)"
                        dot={{
                          r: 2.5,
                          fill: 'var(--background)',
                          stroke: '#3b82f6',
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 5,
                          fill: '#3b82f6',
                          stroke: 'var(--foreground)',
                          strokeWidth: 1.5,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie distribution chart */}
              <div className="space-y-2 flex flex-col justify-between order-1 lg:order-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('analytics.charts.winLossRatio')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t('analytics.charts.winLossRatioDesc')}
                  </p>
                </div>
                {winLossData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground italic">
                    {t('analytics.charts.noData')}
                  </div>
                ) : (
                  <div className="h-[220px] w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {winLossData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        {t('analytics.charts.winRate')}
                      </p>
                      <p className="text-2xl font-black text-foreground font-tabular">
                        {stats.winRate.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
                {/* Labels legend */}
                <div className="flex justify-center gap-4 text-xs font-semibold text-muted-foreground border-t border-border/40 pt-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                    {t('analytics.charts.winsLabel', { count: stats.winCount })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    {t('analytics.charts.lossesLabel', { count: stats.lossCount })}
                  </span>
                  {stats.breakevenCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 inline-block" />
                      {t('analytics.charts.beLabel', { count: stats.breakevenCount })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'time' && (
            <motion.div
              key="panel-time"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Daily day of week performance */}
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('analytics.charts.dayOfWeek')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t('analytics.charts.dayOfWeekDesc')}
                  </p>
                </div>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.dailyPerformance}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        tickFormatter={(val: string) => val.slice(0, 3)}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        dx={-8}
                        tickFormatter={(v: number) => `$${v}`}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0] as any}>
                        {stats.dailyPerformance.map((entry, idx) => (
                          <Cell
                            key={`daily-bar-${idx}`}
                            fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly P&L performance */}
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('analytics.charts.monthlyPnl')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t('analytics.charts.monthlyPnlDesc')}
                  </p>
                </div>
                {stats.monthlyPerformance.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground italic">
                    {t('analytics.charts.noMonthlyData')}
                  </div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.monthlyPerformance}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dy={8}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dx={-8}
                          tickFormatter={(v: number) => `$${v}`}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0] as any}>
                          {stats.monthlyPerformance.map((entry, idx) => (
                            <Cell
                              key={`monthly-bar-${idx}`}
                              fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'}
                              fillOpacity={0.85}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div
              key="panel-market"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Pair performance breakdown */}
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('analytics.charts.assetPairPnl')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t('analytics.charts.assetPairPnlDesc')}
                  </p>
                </div>
                {stats.pairPerformance.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground italic">
                    {t('analytics.charts.noAssetData')}
                  </div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.pairPerformance}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="pair"
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dy={8}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dx={-8}
                          tickFormatter={(v: number) => `$${v}`}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0] as any}>
                          {stats.pairPerformance.map((entry, idx) => (
                            <Cell
                              key={`pair-bar-${idx}`}
                              fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                              fillOpacity={0.85}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Strategy performance breakdown */}
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('analytics.charts.strategyReturn')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t('analytics.charts.strategyReturnDesc')}
                  </p>
                </div>
                {stats.strategyPerformance.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground italic">
                    {t('analytics.charts.noStrategyData')}
                  </div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.strategyPerformance}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="strategy"
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dy={8}
                          tickFormatter={(val: string) =>
                            val.length > 8 ? `${val.slice(0, 8)}…` : val
                          }
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dx={-8}
                          tickFormatter={(v: number) => `$${v}`}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0] as any}>
                          {stats.strategyPerformance.map((entry, idx) => (
                            <Cell
                              key={`strategy-bar-${idx}`}
                              fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'}
                              fillOpacity={0.85}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
