'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

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
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {pieData.map((d: any, i: number) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[10px] font-bold text-muted-foreground truncate">{d.name}</span>
            </div>
          ))}
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