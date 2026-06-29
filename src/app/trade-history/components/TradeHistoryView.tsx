'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, BookOpen, AlertTriangle } from 'lucide-react';
import { useTrades } from '@/contexts/TradesContext';
import TradeHistoryHeader from './TradeHistoryHeader';
import AnalyticsSummary from './AnalyticsSummary';
import FilterBar from './FilterBar';
import TradeCard from './TradeCard';
import Pagination from './Pagination';
import TradeHistoryLoading from './TradeHistoryLoading';
import TradeHistoryEmpty from './TradeHistoryEmpty';
import TradeDetailsModal from '@/app/dashboard/components/TradeDetailsModal';
import type { DbTrade } from '@/lib/trades/types';
import { getTradePnL } from '@/lib/trades/analytics';

const ITEMS_PER_PAGE = 12;

export default function TradeHistoryView() {
  const { trades, analytics, isLoading, isEmpty, error } = useTrades();

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'win' | 'loss' | 'breakeven'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [pairFilter, setPairFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedTrade, setSelectedTrade] = useState<DbTrade | null>(null);

  // Available pairs (extracted from all trades)
  const availablePairs = useMemo(() => {
    const pairs = new Set<string>();
    trades.forEach((t) => {
      if (t.asset_name) pairs.add(t.asset_name);
    });
    return Array.from(pairs).sort();
  }, [trades]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, directionFilter, pairFilter, dateFrom, dateTo, sortOption]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      statusFilter !== 'all' ||
      directionFilter !== 'all' ||
      pairFilter !== '' ||
      dateFrom !== '' ||
      dateTo !== ''
    );
  }, [searchQuery, statusFilter, directionFilter, pairFilter, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDirectionFilter('all');
    setPairFilter('');
    setDateFrom('');
    setDateTo('');
    setSortOption('newest');
  };

  // Filter and Sort Logic
  const filteredAndSortedTrades = useMemo(() => {
    let result = [...trades];

    // 1. Text Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.asset_name?.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query) ||
          t.market_type?.toLowerCase().includes(query) ||
          t.trade_title?.toLowerCase().includes(query) ||
          t.strategy_used?.toLowerCase().includes(query)
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => {
        const pnl = getTradePnL(t);
        const status = t.trade_status || (pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven');
        return status === statusFilter;
      });
    }

    // 3. Direction Filter
    if (directionFilter !== 'all') {
      result = result.filter((t) => t.trade_direction === directionFilter);
    }

    // 4. Pair/Asset Filter
    if (pairFilter) {
      result = result.filter((t) => t.asset_name === pairFilter);
    }

    // 5. Date From Filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter((t) => {
        const rawDate = t.trade_date || t.created_at || '';
        const tDate = new Date(rawDate);
        return tDate >= fromDate;
      });
    }

    // 6. Date To Filter
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((t) => {
        const rawDate = t.trade_date || t.created_at || '';
        const tDate = new Date(rawDate);
        return tDate <= toDate;
      });
    }

    // 7. Sort
    result.sort((a, b) => {
      const dateA = new Date(a.trade_date || a.created_at || '').getTime();
      const dateB = new Date(b.trade_date || b.created_at || '').getTime();
      const pnlA = getTradePnL(a);
      const pnlB = getTradePnL(b);

      switch (sortOption) {
        case 'oldest':
          return dateA - dateB;
        case 'highest-profit':
          return pnlB - pnlA;
        case 'biggest-loss':
          return pnlA - pnlB;
        case 'newest':
        default:
          return dateB - dateA;
      }
    });

    return result;
  }, [
    trades,
    searchQuery,
    statusFilter,
    directionFilter,
    pairFilter,
    dateFrom,
    dateTo,
    sortOption,
  ]);

  // Paginated trades
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedTrades, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedTrades.length / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TradeHistoryHeader />
        <TradeHistoryLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <TradeHistoryHeader />
        <div className="card-elevated border-red-500/20 bg-red-500/5 p-6 rounded-xl flex items-center gap-4">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-foreground text-sm">Failed to load trade history</h3>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <TradeHistoryHeader />
        <TradeHistoryEmpty />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <TradeHistoryHeader />

      {/* Analytics Summary */}
      <AnalyticsSummary analytics={analytics} />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        directionFilter={directionFilter}
        onDirectionFilterChange={setDirectionFilter}
        pairFilter={pairFilter}
        onPairFilterChange={setPairFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        sortOption={sortOption}
        onSortChange={setSortOption}
        availablePairs={availablePairs}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Trades Grid */}
      {filteredAndSortedTrades.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated flex flex-col items-center justify-center text-center py-16 px-4"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <SlidersHorizontal size={20} />
          </div>
          <h4 className="text-base font-semibold text-foreground mb-1">
            No trades match your filters
          </h4>
          <p className="text-xs text-muted-foreground max-w-xs mb-4 leading-relaxed">
            Try adjusting your search term, changing status or direction, or expanding the date
            range.
          </p>
          <button onClick={handleClearFilters} className="btn-secondary py-1.5 px-4 text-xs">
            Reset All Filters
          </button>
        </motion.div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedTrades.map((trade, idx) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  index={idx}
                  onClick={() => setSelectedTrade(trade)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedTrades.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Trade Details Modal */}
      <TradeDetailsModal
        trade={selectedTrade}
        isOpen={selectedTrade !== null}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}
