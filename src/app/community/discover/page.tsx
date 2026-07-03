'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TraderCard from '../components/TraderCard';
import { Loader2, Users, Search, ListFilter, X } from 'lucide-react';
import { getPublicTraders } from '@/services/communityService';
import type { PublicTraderProfile, PaginatedTraders } from '@/types/community';
import { useDebounce } from '@/hooks/useDebounce';

const SkeletonCard = () => (
  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-full bg-white/[0.05] flex-shrink-0"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-white/[0.05] rounded"></div>
          <div className="h-3 w-24 bg-white/[0.05] rounded"></div>
        </div>
      </div>
    </div>
    <div className="h-3 w-full bg-white/[0.05] rounded mt-4"></div>
    <div className="h-3 w-3/4 bg-white/[0.05] rounded mt-2"></div>
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="space-y-1.5">
        <div className="h-2.5 w-20 bg-white/[0.05] rounded"></div>
        <div className="h-4 w-12 bg-white/[0.05] rounded"></div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-20 bg-white/[0.05] rounded"></div>
        <div className="h-4 w-12 bg-white/[0.05] rounded"></div>
      </div>
    </div>
    <div className="flex justify-between mt-6">
      <div className="h-9 w-24 bg-white/[0.05] rounded-lg"></div>
      <div className="h-9 w-24 bg-white/[0.05] rounded-lg"></div>
    </div>
  </div>
);

export default function DiscoverPage() {
  const router = useRouter();
  const [traders, setTraders] = useState<PublicTraderProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const fetchTraders = useCallback(
    async (pageNum: number, query: string, sort: string, append: boolean = false) => {
      if (pageNum === 1 && !append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const result: PaginatedTraders = await getPublicTraders(pageNum, query, sort);
        setTraders(prev => (append ? [...prev, ...result.traders] : result.traders));
        setTotal(result.total);
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load traders');
        console.error('[DiscoverPage] Error:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Effect for initial load and when search/sort changes
  useEffect(() => {
    setPage(1);
    fetchTraders(1, debouncedSearchTerm, sortBy, false);
  }, [debouncedSearchTerm, sortBy, fetchTraders]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTraders(nextPage, debouncedSearchTerm, sortBy, true);
  }, [page, debouncedSearchTerm, sortBy, fetchTraders]);

  const sortOptions = useMemo(() => [
    { value: 'createdAt', label: 'Recently Joined' },
    { value: 'mostActive', label: 'Most Active' },
    { value: 'highestWinRate', label: 'Highest Win Rate' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ], []);

  return (
    <div className="w-full max-w-[1800px] mx-auto px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Community</h1>
        <p className="mt-2 text-muted-foreground">
          Discover and connect with public traders from around the world.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="text-sm text-muted-foreground flex-shrink-0">
          {total > 0 ? `• ${total} Public Traders` : '• No public traders yet'}
        </div>
        <div className="flex-grow w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, country, style..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg pl-9 pr-9 py-2 text-sm focus:ring-primary focus:border-primary"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none w-full md:w-auto bg-white/[0.02] border border-white/[0.05] rounded-lg pl-9 pr-8 py-2 text-sm focus:ring-primary focus:border-primary"
          >
            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md text-sm">{error}</p>
          <button
            onClick={() => fetchTraders(1, debouncedSearchTerm, sortBy)}
            className="mt-6 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-semibold transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && traders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="h-24 w-24 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Users className="w-12 h-12 text-primary/50" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            {searchTerm ? 'No traders found' : 'No public traders yet'}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
            {searchTerm
              ? "No public traders match your search criteria. Try a different search."
              : "Be the first trader to join the community by enabling Public Profile in Settings."}
          </p>
          {!searchTerm && (
            <button onClick={() => router.push('/settings/profile')} className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold transition-all">
              Open Settings
            </button>
          )}
        </div>
      )}

      {/* Trader Grid */}
      {!loading && !error && traders.length > 0 && (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {traders.length} of {total} trader{total !== 1 && 's'}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {traders.map(trader => (
              <TraderCard key={trader.id} trader={trader} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] rounded-xl text-sm font-semibold text-foreground transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}