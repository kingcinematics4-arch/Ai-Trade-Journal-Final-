'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import type { PublicTraderProfile } from '@/types/community';
import TraderCard from '../components/TraderCard';
import SearchBar from '../components/SearchBar';
import { Loader2 } from 'lucide-react';

interface DiscoverClientProps {
  initialTraders: PublicTraderProfile[];
  initialHasMore: boolean;
}

export default function DiscoverClient({ initialTraders, initialHasMore }: DiscoverClientProps) {
  const [traders, setTraders] = useState<PublicTraderProfile[]>(initialTraders);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const loadMoreTraders = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      searchQuery,
      sortBy,
    });
    const response = await fetch(`/api/community/traders?${params.toString()}`);
    if (!response.ok) {
      setIsLoading(false);
      return;
    }
    const result = await response.json();
    setTraders((prev) => [...prev, ...result.traders]);
    setPage((prev) => prev + 1);
    setHasMore(result.hasMore);
    setIsLoading(false);
  }, [page, hasMore, isLoading, searchQuery, sortBy]);

  useEffect(() => {
    if (inView) {
      loadMoreTraders();
    }
  }, [inView, loadMoreTraders]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setHasMore(true);
    const params = new URLSearchParams({
      page: '1',
      searchQuery: query,
      sortBy,
    });
    const response = await fetch(`/api/community/traders?${params.toString()}`);
    if (response.ok) {
      const result = await response.json();
      setTraders(result.traders);
      setHasMore(result.hasMore);
    }
    setPage(2);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SearchBar onSearch={handleSearch} />

      {/* Main content area for trader cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {traders.map((trader) => (
          <TraderCard key={trader.id} trader={trader} />
        ))}
      </div>

      {/* Loading spinner and intersection observer */}
      {hasMore && (
        <div ref={ref} className="flex justify-center items-center py-12">
          {isLoading && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
        </div>
      )}

      {!hasMore && traders.length > 0 && (
        <p className="text-center text-muted-foreground py-12">
          You've reached the end of the list.
        </p>
      )}
    </div>
  );
}
