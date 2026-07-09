'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import {
  BarChart3,
  RefreshCw,
  PlusCircle,
  Calendar,
  SlidersHorizontal,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  X,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTrades } from '@/contexts/TradesContext';
import { computeAdvancedAnalytics } from '@/lib/trades/analyticsEngine';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import SearchableSelect from '@/components/ui/SearchableSelect';

// Import child analytics components
import AnalyticsKpiGrid from './AnalyticsKpiGrid';
import DynamicInsightsCard from './DynamicInsightsCard';
import AnalyticsChartsGrid from './AnalyticsChartsGrid';
import AdvancedMetricsPanel from './AdvancedMetricsPanel';

type TimeframeOption = 'all' | 'today' | '7days' | '30days' | '90days' | 'year' | 'custom';

export default function AnalyticsView() {
  const { t } = useTranslation();
  const { trades, isLoading, isEmpty, error, refetch } = useTrades();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pairFilter, setPairFilter] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'buy' | 'sell'>('all');

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setTimeout(() => toast.success(t('analytics.view.refreshSuccess')), 0);
    } catch (err) {
      setTimeout(() => toast.error(t('analytics.view.refreshFailed')), 0);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get unique lists for dropdown filters from unfiltered trades
  const availablePairs = useMemo(() => {
    const pairs = new Set<string>();
    trades.forEach((t) => {
      if (t.asset_name) pairs.add(t.asset_name);
    });
    return Array.from(pairs).sort();
  }, [trades]);

  const availableStrategies = useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach((t) => {
      if (t.strategy_used) strategies.add(t.strategy_used);
    });
    return Array.from(strategies).sort();
  }, [trades]);

  const assetItems = useMemo(() => {
    return [
      { value: '', label: t('analytics.view.allAssets') },
      ...availablePairs.map((pair) => ({ value: pair, label: pair })),
    ];
  }, [availablePairs, t]);

  const strategyItems = useMemo(() => {
    return [
      { value: '', label: t('analytics.view.allStrategies') },
      ...availableStrategies.map((strat) => ({ value: strat, label: strat })),
    ];
  }, [availableStrategies, t]);

  const directionItems = useMemo(() => {
    return [
      { value: 'all', label: t('analytics.view.allDirections') },
      { value: 'buy', label: t('analytics.view.longBuys') },
      { value: 'sell', label: t('analytics.view.shortSells') },
    ];
  }, [t]);

  // Reset page parameters if timeframe changes
  useEffect(() => {
    if (timeframe !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
  }, [timeframe]);

  const hasActiveFilters = useMemo(() => {
    return (
      timeframe !== 'all' ||
      pairFilter !== '' ||
      strategyFilter !== '' ||
      directionFilter !== 'all' ||
      dateFrom !== '' ||
      dateTo !== ''
    );
  }, [timeframe, pairFilter, strategyFilter, directionFilter, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setTimeframe('all');
    setPairFilter('');
    setStrategyFilter('');
    setDirectionFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // 1. Client-Side Slicing and Filtering Logic
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Filter by Timeframe / Date Range
    if (timeframe !== 'all') {
      const now = new Date();

      if (timeframe === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        result = result.filter((t) => {
          const rawDate = t.trade_date || t.created_at || '';
          const tDate = new Date(rawDate);
          return tDate >= todayStart && tDate <= todayEnd;
        });
      } else if (timeframe === '7days') {
        const limit = new Date();
        limit.setDate(now.getDate() - 7);
        limit.setHours(0, 0, 0, 0);
        result = result.filter((t) => {
          const rawDate = t.trade_date || t.created_at || '';
          const tDate = new Date(rawDate);
          return tDate >= limit;
        });
      } else if (timeframe === '30days') {
        const limit = new Date();
        limit.setDate(now.getDate() - 30);
        limit.setHours(0, 0, 0, 0);
        result = result.filter((t) => {
          const rawDate = t.trade_date || t.created_at || '';
          const tDate = new Date(rawDate);
          return tDate >= limit;
        });
      } else if (timeframe === '90days') {
        const limit = new Date();
        limit.setDate(now.getDate() - 90);
        limit.setHours(0, 0, 0, 0);
        result = result.filter((t) => {
          const rawDate = t.trade_date || t.created_at || '';
          const tDate = new Date(rawDate);
          return tDate >= limit;
        });
      } else if (timeframe === 'year') {
        const thisYear = now.getFullYear();
        result = result.filter((t) => {
          const rawDate = t.trade_date || t.created_at || '';
          const tDate = new Date(rawDate);
          return tDate.getFullYear() === thisYear;
        });
      } else if (timeframe === 'custom') {
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          result = result.filter((t) => {
            const rawDate = t.trade_date || t.created_at || '';
            const tDate = new Date(rawDate);
            return tDate >= fromDate;
          });
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          result = result.filter((t) => {
            const rawDate = t.trade_date || t.created_at || '';
            const tDate = new Date(rawDate);
            return tDate <= toDate;
          });
        }
      }
    }

    // Filter by Asset / Pair symbol
    if (pairFilter) {
      result = result.filter((t) => t.asset_name === pairFilter);
    }

    // Filter by Strategy
    if (strategyFilter) {
      result = result.filter((t) => t.strategy_used === strategyFilter);
    }

    // Filter by Type/Direction
    if (directionFilter !== 'all') {
      result = result.filter((t) => t.trade_direction === directionFilter);
    }

    return result;
  }, [trades, timeframe, dateFrom, dateTo, pairFilter, strategyFilter, directionFilter]);

  // 2. Compute Advanced Statistics Memoization
  const computedStats = useMemo(() => {
    return computeAdvancedAnalytics(filteredTrades);
  }, [filteredTrades]);

  // Loading skeleton state matching the premium UI
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header Skeleton */}
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

        {/* Filter Bar Skeleton */}
        <div className="card-elevated p-4.5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`timeframe-skel-${i}`} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-3 border-t border-border/40">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Stat Grid Skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`stat-card-skel-${i}`} className="card-elevated p-4 space-y-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>

        {/* Charts and Math Panel Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-elevated p-6 h-[380px] space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <div className="card-elevated p-6 h-[380px] space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-44 w-44 rounded-full mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Error Card
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t('analytics.view.title')}</h1>
        </div>
        <div className="card-elevated border-red-500/20 bg-red-500/5 p-6 rounded-xl flex items-center gap-4">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {t('analytics.view.engineInterrupted')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Entirely Empty Journal Setup
  if (isEmpty) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="text-primary" size={24} />
              {t('analytics.view.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('analytics.view.description')}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="card-elevated flex flex-col items-center justify-center text-center py-24 px-6"
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
          >
            <Compass size={36} className="text-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t('analytics.view.noTradingRecords')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
            {t('analytics.view.noTradingRecordsDesc')}
          </p>
          <Link
            href="/add-trade"
            className="btn-primary flex items-center gap-2 py-2.5 px-6 text-sm font-semibold shadow-md shadow-primary/20"
          >
            <PlusCircle size={16} />
            {t('analytics.view.logFirstTrade')}
          </Link>
        </motion.div>
      </div>
    );
  }

  // Active View Render
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={20} className="text-primary animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{t('analytics.view.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('analytics.view.description')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
            aria-label={t('analytics.view.aria.syncAnalytics')}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/add-trade"
            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm font-semibold shadow-md shadow-primary/20"
          >
            <PlusCircle size={15} />
            {t('analytics.view.addTrade')}
          </Link>
        </div>
      </div>

      {/* 2. Unified Filter Block */}
      <div className="card-elevated p-4 space-y-4">
        {/* Row 1: Timeframe selector buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Calendar size={13} className="text-primary" />
            <span>{t('analytics.view.timeRangeFilter')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { value: 'all', label: t('analytics.view.allTime') },
                { value: 'today', label: t('analytics.view.today') },
                { value: '7days', label: t('analytics.view.7days') },
                { value: '30days', label: t('analytics.view.30days') },
                { value: '90days', label: t('analytics.view.90days') },
                { value: 'year', label: t('analytics.view.thisYear') },
                { value: 'custom', label: t('analytics.view.custom') },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeframe(opt.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  timeframe === opt.value
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Custom Date Inputs */}
        <AnimatePresence>
          {timeframe === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/20 overflow-hidden"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  {t('analytics.view.startDate')}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="form-input py-1.5 text-xs bg-card w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  {t('analytics.view.endDate')}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="form-input py-1.5 text-xs bg-card w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 2: Asset/Strategy/Direction dropdowns */}
        <div className="flex flex-wrap gap-3 items-center pt-3.5 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <SlidersHorizontal size={13} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[10px]">
              {t('analytics.view.segment')}
            </span>
          </div>

          {/* Asset Dropdown */}
          <SearchableSelect
            items={assetItems}
            value={pairFilter}
            onSelect={setPairFilter}
            placeholder={t('analytics.view.allAssets')}
            searchable={true}
            buttonClassName="form-input py-1.5 text-xs w-auto min-w-[130px] bg-card font-medium"
          />

          {/* Strategy Dropdown */}
          <SearchableSelect
            items={strategyItems}
            value={strategyFilter}
            onSelect={setStrategyFilter}
            placeholder={t('analytics.view.allStrategies')}
            searchable={true}
            buttonClassName="form-input py-1.5 text-xs w-auto min-w-[140px] bg-card font-medium"
          />

          {/* Direction Selector */}
          <SearchableSelect
            items={directionItems}
            value={directionFilter}
            onSelect={(val) => setDirectionFilter(val as any)}
            searchable={false}
            buttonClassName="form-input py-1.5 text-xs w-auto min-w-[110px] bg-card font-medium"
          />

          {/* Active filters clear option */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/35 transition-colors"
            >
              <X size={12} />
              {t('analytics.view.resetFilters')}
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Analytics Dash Panels */}
      {filteredTrades.length === 0 ? (
        // Polished filter-bound Empty State
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated flex flex-col items-center justify-center text-center py-20 px-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground border border-border">
            <SlidersHorizontal size={24} />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-1.5">
            {t('analytics.view.noTradesMatch')}
          </h4>
          <p className="text-xs text-muted-foreground max-w-xs mb-6 leading-relaxed">
            {t('analytics.view.noTradesMatchDesc')}
          </p>
          <button
            onClick={handleClearFilters}
            className="btn-secondary flex items-center gap-2 py-2 px-5 text-xs font-semibold border border-primary/20 hover:border-primary/45 transition-colors"
          >
            <X size={13} />
            {t('analytics.view.resetAllFilters')}
          </button>
        </motion.div>
      ) : (
        // Grid Display
        <div className="space-y-6">
          {/* KPI STAT CARDS */}
          <AnalyticsKpiGrid stats={computedStats} />

          {/* DYNAMIC PERFORMANCE COACH INSIGHTS */}
          <DynamicInsightsCard stats={computedStats} />

          {/* INTERACTIVE CHARTS & RATIOS */}
          <AnalyticsChartsGrid stats={computedStats} />

          {/* MATHEMATICAL ADVANCED METRICS PANEL */}
          <AdvancedMetricsPanel stats={computedStats} />
        </div>
      )}
    </div>
  );
}
