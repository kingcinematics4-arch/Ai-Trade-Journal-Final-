'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Bell, PlusCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradesContext';
import UserProfileSummary from '@/components/UserProfileSummary';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPanel from './NotificationPanel';
import { useTranslation } from '@/i18n/hooks/useTranslation';

const timeframes = ['Today', 'This Week', 'This Month', 'Last 3 Months', 'All Time'];

export default function DashboardHeader() {
  const { t } = useTranslation();
  const { displayName, isLoading } = useAuth();
  const { refetch } = useTrades();
  const { unreadCount } = useNotifications();
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const firstName = displayName?.split(' ')[0] || displayName || 'Trader';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast?.success('Dashboard data refreshed');
    } catch (error) {
      toast?.error('Failed to refresh dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-5 w-full max-w-[100vw] overflow-hidden box-border px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          {isLoading ? (
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1 hidden sm:block">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : (
            <>
              <UserProfileSummary size="md" layout="horizontal" className="flex-shrink-0" />
              <div className="min-w-0 sm:border-l sm:border-border sm:pl-4 flex-1 hidden sm:block">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                  {t('dashboard.title')}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                  {t('dashboard.welcome', { name: firstName })}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:ml-auto w-full lg:w-auto mt-3 lg:mt-0 justify-end flex-shrink-0 overflow-hidden">
          <div className="relative flex-shrink-0 min-w-0">
            <button
              type="button"
              onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
              className="flex items-center justify-between w-full sm:w-auto gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-card/40 backdrop-blur-md border border-white/[0.1] rounded-xl text-sm font-bold text-white hover:bg-white/[0.05] transition-all active:scale-[0.98] outline-none whitespace-nowrap"
            >
              {selectedTimeframe}
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${showTimeframeDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            {showTimeframeDropdown && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-full sm:w-44 bg-slate-900/90 backdrop-blur-2xl border border-white/[0.1] rounded-2xl z-20 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                {timeframes.map((tf) => (
                  <button
                    key={`tf-${tf}`}
                    type="button"
                    onClick={() => {
                      setSelectedTimeframe(tf);
                      setShowTimeframeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b border-white/[0.05] last:border-0 ${
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
            className="flex items-center justify-center p-2.5 bg-card/40 backdrop-blur-md border border-white/[0.1] rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all duration-150 disabled:opacity-50 flex-shrink-0"
            aria-label="Refresh analytics"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative flex items-center justify-center p-2.5 bg-card/40 backdrop-blur-md border border-white/[0.1] rounded-xl transition-all duration-150 flex-shrink-0 ${showNotifications ? 'text-primary bg-white/[0.05]' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'}`}
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 border-2 border-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && <NotificationPanel />}
          </div>
          <Link
            href="/add-trade"
            className="btn-primary flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 sm:px-5 text-sm font-bold shadow-xl shadow-primary/20 rounded-xl transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <PlusCircle size={15} />
            Add Trade
          </Link>
        </div>
      </div>
    </div>
  );
}
