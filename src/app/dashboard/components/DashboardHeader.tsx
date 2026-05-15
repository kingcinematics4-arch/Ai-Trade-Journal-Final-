'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Bell, PlusCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const timeframes = ['Today', 'This Week', 'This Month', 'Last 3 Months', 'All Time'];

export default function DashboardHeader() {
  const { displayName, profile, isLoading } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

  const firstName = displayName.split(' ')[0] || displayName;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // BACKEND: GET /api/analytics/refresh — re-fetch all dashboard data
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
    toast?.success('Dashboard data refreshed');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? (
            <Skeleton className="h-4 w-72 inline-block" />
          ) : (
            <>
              Welcome back, {firstName} — here is your trading performance overview
              {profile?.email && (
                <span className="block text-xs mt-1 text-muted-foreground/80">{profile.email}</span>
              )}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Timeframe Selector */}
        <div className="relative">
          <button
            onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
          >
            {selectedTimeframe}
            <ChevronDown size={14} className={`transition-transform duration-150 ${showTimeframeDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showTimeframeDropdown && (
            <div className="absolute right-0 top-full mt-1 w-44 card-elevated z-20 py-1 shadow-xl">
              {timeframes?.map((tf) => (
                <button
                  key={`tf-${tf}`}
                  onClick={() => { setSelectedTimeframe(tf); setShowTimeframeDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-100 ${
                    selectedTimeframe === tf
                      ? 'text-primary bg-primary/10' :'text-foreground hover:bg-muted'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
          aria-label="Refresh analytics"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* Add Trade CTA */}
        <Link
          href="/add-trade"
          className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
        >
          <PlusCircle size={15} />
          Add Trade
        </Link>
      </div>
    </div>
  );
}