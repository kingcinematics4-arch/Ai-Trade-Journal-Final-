'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Bell, PlusCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileSummary from '@/components/UserProfileSummary';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const timeframes = ['Today', 'This Week', 'This Month', 'Last 3 Months', 'All Time'];

export default function DashboardHeader() {
  const { displayName, isLoading } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

  const firstName = displayName.split(' ')[0] || displayName;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
    toast?.success('Dashboard data refreshed');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          {isLoading ? (
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : (
            <>
              <UserProfileSummary size="lg" layout="horizontal" className="flex-shrink-0" />
              <div className="min-w-0 sm:border-l sm:border-border sm:pl-4 flex-1">
                <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Welcome back, {firstName} — here is your trading performance overview
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
          >
            {selectedTimeframe}
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${showTimeframeDropdown ? 'rotate-180' : ''}`}
            />
          </button>
          {showTimeframeDropdown && (
            <div className="absolute left-0 top-full mt-1 w-44 card-elevated z-20 py-1 shadow-xl">
              {timeframes.map((tf) => (
                <button
                  key={`tf-${tf}`}
                  type="button"
                  onClick={() => {
                    setSelectedTimeframe(tf);
                    setShowTimeframeDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-100 ${
                    selectedTimeframe === tf
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
          aria-label="Refresh analytics"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          className="relative p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
        <Link href="/add-trade" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <PlusCircle size={15} />
          Add Trade
        </Link>
      </div>
      </div>
    </div>
  );
}
