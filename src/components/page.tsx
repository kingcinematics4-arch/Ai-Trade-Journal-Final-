'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTrades } from '@/contexts/TradesContext';
import { calculateStrategyAnalytics } from '@/lib/trades/strategy-analytics';
import { Layers, Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import StrategyOverview from '@/components/strategies/StrategyOverview';
import StrategyTable from '@/components/strategies/StrategyTable';
import StrategyCharts from '@/components/strategies/StrategyCharts';
import StrategyTimeline from '@/components/strategies/StrategyTimeline';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

export default function StrategyAnalyticsPage() {
  const { trades, isLoading } = useTrades();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const analytics = useMemo(() => {
    if (!trades) return null;
    
    // Apply basic filters
    const filtered = trades.filter(t => {
      const date = new Date(t.trade_date);
      const inDateRange = (!dateRange.start || date >= new Date(dateRange.start)) &&
                          (!dateRange.end || date <= new Date(dateRange.end));
      return inDateRange;
    });

    return calculateStrategyAnalytics(filtered);
  }, [trades, dateRange]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[350px] rounded-3xl" />
      </div>
    );
  }

  if (!analytics || analytics.strategies.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mb-6 border border-white/[0.05]">
          <Layers className="text-muted-foreground/40" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Strategy Data Found</h2>
        <p className="text-muted-foreground max-w-md">
          Start assigning strategies to your trades in the "Add Trade" form to see detailed performance analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Layers className="text-blue-500" />
            Strategy Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-bold opacity-50">
            Performance Tracking & Execution Edge
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search Strategy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-all w-full md:w-64"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2">
            <CalendarIcon size={16} className="text-muted-foreground" />
            <input 
              type="date" 
              className="bg-transparent text-xs text-white outline-none"
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <span className="text-muted-foreground">→</span>
            <input 
              type="date" 
              className="bg-transparent text-xs text-white outline-none"
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <StrategyOverview analytics={analytics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyCharts analytics={analytics} />
        <StrategyTimeline timeline={analytics.timeline} />
      </div>

      <div className="card-premium p-0 overflow-hidden">
        <div className="p-6 border-b border-white/[0.05]">
          <h3 className="font-bold text-white">Strategy Performance Matrix</h3>
        </div>
        <StrategyTable strategies={analytics.strategies} searchTerm={searchTerm} />
      </div>
    </div>
  );
}