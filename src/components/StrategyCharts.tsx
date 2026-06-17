'use client';
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Sector, Legend } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'];

export default function StrategyCharts({ analytics }: { analytics: any }) {
  const pieData = analytics.strategies.slice(0, 7).map((s: any) => ({
    name: s.name,
    value: s.totalTrades
  }));

  const barData = analytics.strategies.slice(0, 10).map((s: any) => ({
    name: s.name,
    wr: parseFloat(s.winRate.toFixed(1)),
    pnl: s.netPnL
  }));

  // Calculate total trades for percentage in pie chart
  // This should be calculated from the full analytics.strategies, not just the sliced pieData
  const totalTradesInPie = pieData.reduce((sum: number, entry: any) => sum + entry.value, 0);

  // Custom Active Shape for Pie Chart Hover
  const ActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-bold font-tabular">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8} // Slightly expand on hover
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="transition-all duration-200 ease-out"
        />
      </g>
    );
  };

  // Custom Tooltip for Pie Chart
  type CustomTooltipProps = TooltipProps<ValueType, NameType> & {
    payload?: Array<{ payload: { name: string; value: number } }>;
  };

  const CustomPieTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalTradesInPie > 0 ? ((data.value / totalTradesInPie) * 100).toFixed(1) : '0.0';
      return (
        <div className="card-elevated shadow-xl p-3 text-xs border border-white/[0.1] rounded-md bg-slate-900/90 backdrop-blur z-50 min-w-[150px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/[0.05]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill as string }} />
            <p className="font-semibold text-white">{data.name}</p>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trades</span>
            <span className="font-bold text-white font-tabular">{data.value}</span>
          </div>
          <div className="flex justify-between gap-4 mt-1">
            <span className="text-muted-foreground">Share</span>
            <span className="font-bold text-white font-tabular">{percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Legend for Pie Chart
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {payload.map((entry: any, index: number) => {
          const percentage = totalTradesInPie > 0 ? ((entry.payload.value / totalTradesInPie) * 100).toFixed(1) : 0;
          return (
            <li key={`item-${index}`} className="flex items-center gap-2 text-muted-foreground">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-medium truncate">{entry.value}</span>
              <span className="font-bold text-white">{entry.payload.name}</span>
              <span className="ml-auto font-tabular text-white/70">{percentage}%</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Distribution Chart */}
      <div className="card-premium p-6">
        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest opacity-50">Usage Distribution</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="42%" // Elevated to leave room for legend
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                activeShape={ActiveShape}
                onMouseEnter={(_, index) => { /* handle active index if needed for external state */ }}
                onMouseLeave={() => { /* handle active index if needed for external state */ }}
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend content={<CustomLegend />} layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win Rate Analysis */}
      <div className="card-premium p-6">
        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest opacity-50">Win Rate Comparison</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                width={100}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Bar 
                dataKey="wr" 
                fill="#3b82f6" 
                radius={[0, 4, 4, 0]} 
                barSize={12} 
                name="Win Rate %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}