'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ReferenceLine 
} from 'recharts';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Clock, 
  PieChart as PieIcon, 
  Tag as TagIcon 
} from 'lucide-react';
import type { AdvancedAnalytics } from '@/lib/trades/analyticsEngine';
import { formatCurrency } from '@/lib/trades/analytics';

interface AnalyticsChartsGridProps {
  stats: AdvancedAnalytics;
}

export default function AnalyticsChartsGrid({ stats }: AnalyticsChartsGridProps) {
  const [activeTab, setActiveTab] = useState<'pnl' | 'time' | 'market'>('pnl');

  const winLossData = [
    { name: 'Wins', value: stats.winCount, color: '#22c55e' },
    { name: 'Losses', value: stats.lossCount, color: '#ef4444' },
    { name: 'Breakevens', value: stats.breakevenCount, color: '#71717a' },
  ].filter(d => d.value > 0);

  // Custom tooltips
  const CustomPnlTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="card-elevated shadow-xl p-3 text-xs border border-border rounded-md bg-background/95 backdrop-blur z-50">
          <p className="text-muted-foreground font-semibold mb-1 border-b border-border/50 pb-1">
            Trade #{data.tradeNumber} — {data.date}
          </p>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trade Return</span>
            <span className={`font-bold ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.pnl, { showSign: true })}
            </span>
          </div>
          <div className="flex justify-between gap-4 mt-1 border-t border-border/50 pt-1">
            <span className="text-muted-foreground">Account P&L</span>
            <span className={`font-black ${data.cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.cumulative, { showSign: true })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="card-elevated shadow-xl p-2.5 text-xs border border-border rounded-md bg-background/95 backdrop-blur z-50">
          <p className="text-muted-foreground font-semibold mb-1 truncate">{data.name}</p>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Net P&L</span>
            <span className={`font-bold ${data.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.value, { showSign: true })}
            </span>
          </div>
          {data.payload.trades && (
            <div className="flex justify-between gap-4 mt-1">
              <span className="text-muted-foreground">Trades Logged</span>
              <span className="font-semibold text-foreground">{data.payload.trades}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-elevated p-6 space-y-6">
      {/* Dynamic Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Performance Charts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Interactive visual analysis of your trading equity curves, session frequencies, and market skews
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-lg border border-border self-start">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'pnl'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp size={13} />
            Equity & Distribution
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'time'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar size={13} />
            Time Performance
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'market'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TagIcon size={13} />
            Assets & Strategies
          </button>
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
              <div className="lg:col-span-2 space-y-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Equity Growth Curve</h4>
                  <p className="text-[11px] text-muted-foreground">Cumulative running P&L across trades</p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="tradeNumber" 
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
                        tickFormatter={(v) => `$${v}`}
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
                        dot={{ r: 2.5, fill: 'var(--background)', stroke: '#3b82f6', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#3b82f6', stroke: 'var(--foreground)', strokeWidth: 1.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie distribution chart */}
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Win / Loss Ratio</h4>
                  <p className="text-[11px] text-muted-foreground">Distribution of profit, loss, and BE trades</p>
                </div>
                {winLossData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground italic">
                    No data
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
                        <Tooltip formatter={(value: number) => [`${value} trades`, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Win Rate</p>
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
                    Wins ({stats.winCount})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    Losses ({stats.lossCount})
                  </span>
                  {stats.breakevenCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 inline-block" />
                      BE ({stats.breakevenCount})
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
                  <h4 className="text-sm font-semibold text-foreground">Day of Week Performance</h4>
                  <p className="text-[11px] text-muted-foreground">Cumulative P&L grouped by weekdays</p>
                </div>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        tickFormatter={(val) => val.slice(0, 3)}
                      />
                      <YAxis 
                        tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        dx={-8}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                      <Bar dataKey="pnl">
                        {stats.dailyPerformance.map((entry, idx) => (
                          <Cell 
                            key={`daily-bar-${idx}`} 
                            fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} 
                            fillOpacity={0.85}
                            radius={entry.pnl >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]}
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
                  <h4 className="text-sm font-semibold text-foreground">Monthly P&L Curve</h4>
                  <p className="text-[11px] text-muted-foreground">Net performance grouped by calendar months</p>
                </div>
                {stats.monthlyPerformance.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground italic">
                    No monthly data available
                  </div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
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
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                        <Bar dataKey="pnl">
                          {stats.monthlyPerformance.map((entry, idx) => (
                            <Cell 
                              key={`monthly-bar-${idx}`} 
                              fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} 
                              fillOpacity={0.85}
                              radius={entry.pnl >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]}
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
                  <h4 className="text-sm font-semibold text-foreground">Asset Pair Net P&L</h4>
                  <p className="text-[11px] text-muted-foreground">Cumulative trade return ranked by symbols</p>
                </div>
                {stats.pairPerformance.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground italic">
                    No asset pair data logged
                  </div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.pairPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
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
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                        <Bar dataKey="pnl">
                          {stats.pairPerformance.map((entry, idx) => (
                            <Cell 
                              key={`pair-bar-${idx}`} 
                              fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} 
                              fillOpacity={0.85}
                              radius={entry.pnl >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]}
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
                  <h4 className="text-sm font-semibold text-foreground">Strategy Net Return</h4>
                  <p className="text-[11px] text-muted-foreground">Cumulative trade P&L grouped by strategies used</p>
                </div>
                {stats.strategyPerformance.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground italic">
                    No strategy data logged
                  </div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.strategyPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                        <XAxis 
                          dataKey="strategy" 
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dy={8}
                          tickFormatter={(val) => val.length > 8 ? `${val.slice(0, 8)}…` : val}
                        />
                        <YAxis 
                          tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          dx={-8}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                        <Bar dataKey="pnl">
                          {stats.strategyPerformance.map((entry, idx) => (
                            <Cell 
                              key={`strategy-bar-${idx}`} 
                              fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} 
                              fillOpacity={0.85}
                              radius={entry.pnl >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]}
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
