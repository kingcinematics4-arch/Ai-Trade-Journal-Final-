'use client';
import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DayPerformance } from '@/types/ai';

interface AiChartsSectionProps {
  dayPerformance: DayPerformance[];
  emotionalTrend: { date: string; score: number }[];
}

export default function AiChartsSection({ dayPerformance, emotionalTrend }: AiChartsSectionProps) {
  // Transform day performance to fit standard week ordering
  const pnlData = dayPerformance.map((d) => ({
    name: d.day.substring(0, 3),
    pnl: d.pnl,
  }));

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* PnL Trend Chart */}
      <motion.div
        variants={chartVariants}
        initial="hidden"
        animate="show"
        className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors duration-300"
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Weekly Performance Trend</h3>
          <p className="text-sm text-muted-foreground">
            PnL distribution across the days of the week
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="var(--primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPnl)"
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Emotion Trend Chart */}
      <motion.div
        variants={chartVariants}
        initial="hidden"
        animate="show"
        className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-accent/30 transition-colors duration-300"
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Emotional Stability Index</h3>
          <p className="text-sm text-muted-foreground">Your mindset state over recent trades</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={emotionalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEmotion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                domain={[0, 5]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Area
                type="step"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorEmotion)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
