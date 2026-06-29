'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, Search, RefreshCw, AlertTriangle, Compass, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTrades } from '@/contexts/TradesContext';
import { calculateStrategyAnalytics } from '@/components/strategy-analytics';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import StrategyOverview from '@/components/StrategyOverview';
import StrategyTable from '@/components/StrategyTable';
import StrategyCharts from '@/components/StrategyCharts';
import StrategyTimeline from '@/components/StrategyTimeline';

export default function StrategiesView() {
  const { trades, isLoading, isEmpty, error, refetch } = useTrades();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setTimeout(() => toast.success('Strategy analytics re-synced successfully'), 0);
    } catch (err) {
      setTimeout(() => toast.error('Failed to sync strategy records'), 0);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate strategy analytics
  const analytics = useMemo(() => {
    return calculateStrategyAnalytics(trades);
  }, [trades]);

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`stat-card-skel-${i}`} className="card-premium p-5 space-y-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-premium p-6 h-[400px]">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <div className="card-premium p-6 h-[400px]">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>

        <div className="card-premium p-6 h-[400px]">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Strategy Analytics</h1>
        </div>
        <div className="card-premium border-red-500/20 bg-red-500/5 p-6 rounded-xl flex items-center gap-4">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-foreground text-sm">Engine Connection Interrupted</h3>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Layers className="text-primary" size={24} />
              Strategy Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyze performance by trading strategy
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="card-premium flex flex-col items-center justify-center text-center py-24 px-6"
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
          >
            <Compass size={36} className="text-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No trading records found</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
            Strategy analytics requires recorded trade data with strategy assignments. Log your
            trades and specify strategies to unlock strategy performance insights.
          </p>
          <Link
            href="/add-trade"
            className="btn-primary flex items-center gap-2 py-2.5 px-6 text-sm font-semibold shadow-md shadow-primary/20"
          >
            <PlusCircle size={16} />
            Log Your First Trade
          </Link>
        </motion.div>
      </div>
    );
  }

  // Active view
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Layers size={20} className="text-primary animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Strategy Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyze performance by trading strategy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
            aria-label="Synchronize Analytics"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/add-trade"
            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm font-semibold shadow-md shadow-primary/20"
          >
            <PlusCircle size={15} />
            Add Trade
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-premium p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Strategy Overview */}
      <StrategyOverview analytics={analytics} />

      {/* Strategy Charts */}
      <StrategyCharts analytics={analytics} />

      {/* Strategy Table */}
      <div className="card-premium p-6">
        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest opacity-50">
          Strategy Performance
        </h3>
        <StrategyTable strategies={analytics.strategies} searchTerm={searchTerm} />
      </div>

      {/* Strategy Timeline */}
      <StrategyTimeline timeline={analytics.timeline} />
    </div>
  );
}
