'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, PlusCircle } from 'lucide-react';
import { useTrades } from '@/contexts/TradesContext';
import { toast } from 'sonner';

export default function TradeHistoryHeader() {
  const { refetch } = useTrades();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Trade data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh trade data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 flex-shrink-0"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse, filter, and analyze all your trades
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
          aria-label="Refresh trades"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
        <Link href="/add-trade" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <PlusCircle size={15} />
          Add Trade
        </Link>
      </div>
    </div>
  );
}
