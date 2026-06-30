'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'win' | 'loss' | 'breakeven';
  onStatusFilterChange: (status: 'all' | 'win' | 'loss' | 'breakeven') => void;
  directionFilter: 'all' | 'buy' | 'sell';
  onDirectionFilterChange: (direction: 'all' | 'buy' | 'sell') => void;
  pairFilter: string;
  onPairFilterChange: (pair: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  sortOption: string;
  onSortChange: (sort: string) => void;
  availablePairs: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  directionFilter,
  onDirectionFilterChange,
  pairFilter,
  onPairFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortOption,
  onSortChange,
  availablePairs,
  hasActiveFilters,
  onClearFilters,
}: FilterBarProps) {
  const { t } = useTranslation();

  const statusOptions: { value: FilterBarProps['statusFilter']; label: string }[] = [
    { value: 'all', label: t('trading.tradeHistory.filterBar.allStatuses') },
    { value: 'win', label: t('trading.win') },
    { value: 'loss', label: t('trading.loss') },
    { value: 'breakeven', label: t('trading.breakEven') },
  ];

  const directionOptions: { value: FilterBarProps['directionFilter']; label: string }[] = [
    { value: 'all', label: t('trading.tradeHistory.filterBar.allTypes') },
    { value: 'buy', label: t('trading.long') },
    { value: 'sell', label: t('trading.short') },
  ];

  const sortOptions = [
    { value: 'newest', label: t('trading.tradeHistory.filterBar.sortOptions.newest') },
    { value: 'oldest', label: t('trading.tradeHistory.filterBar.sortOptions.oldest') },
    { value: 'highest-profit', label: t('trading.tradeHistory.filterBar.sortOptions.highestProfit') },
    { value: 'biggest-loss', label: t('trading.tradeHistory.filterBar.sortOptions.biggestLoss') },
  ];

  return (
    <div className="card-elevated p-4 space-y-4">
      {/* Row 1: Search + Status + Direction */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-grow max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={t('trading.tradeHistory.filterBar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input pl-9 py-2 text-sm w-full"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="h-8 w-px bg-border hidden lg:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium mr-1 lg:hidden">{t('trading.tradeHistory.filterBar.statusLabel')}</span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                statusFilter === opt.value
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-border hidden lg:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium mr-1 lg:hidden">{t('trading.tradeHistory.filterBar.typeLabel')}</span>
          {directionOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDirectionFilterChange(opt.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                directionFilter === opt.value
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Pair + Dates + Sort + Clear */}
      <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <SlidersHorizontal size={13} />
          <span className="text-xs font-medium">{t('trading.tradeHistory.filterBar.filtersLabel')}</span>
        </div>

        <select
          value={pairFilter}
          onChange={(e) => onPairFilterChange(e.target.value)}
          className="form-input py-1.5 text-sm w-auto min-w-[130px] bg-card"
        >
          <option value="">{t('trading.tradeHistory.filterBar.allPairs')}</option>
          {availablePairs.map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="form-input py-1.5 text-sm flex-1 sm:w-auto bg-card"
            placeholder={t('trading.tradeHistory.filterBar.from')}
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="form-input py-1.5 text-sm flex-1 sm:w-auto bg-card"
            placeholder={t('trading.tradeHistory.filterBar.to')}
          />
        </div>

        <div className="flex-grow lg:flex-grow-0 lg:ml-auto">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="form-input py-1.5 text-sm w-full lg:w-auto min-w-[140px] bg-card"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="btn-secondary flex items-center gap-1.5 py-1.5 px-3.5 text-xs text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/35"
          >
            <X size={12} />
            {t('trading.tradeHistory.filterBar.resetFilters')}
          </button>
        )}
      </div>
    </div>
  );
}
