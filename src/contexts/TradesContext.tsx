'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  computeTradeAnalytics,
  generateTradeInsights,
  parseSafeNumber,
} from '@/lib/trades/analytics';
import { dbTradeFromRow, mapDbTrades } from '@/lib/trades/mapTrade';
import type { DbTrade, TradeAnalytics, TradeInsight, TradeRow } from '@/lib/trades/types';

type TradesContextValue = {
  trades: DbTrade[];
  tradeRows: TradeRow[];
  analytics: TradeAnalytics;
  insights: TradeInsight[];
  isLoading: boolean;
  isEmpty: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateTrade: (id: string, updates: any) => Promise<void>;
};

const TradesContext = createContext<TradesContextValue | null>(null);

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [trades, setTrades] = useState<DbTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const cleaned = (data ?? []).map((row) => {
        const t = dbTradeFromRow(row as Record<string, unknown>);
        return {
          ...t,
          pnl_amount: parseSafeNumber(t.pnl_amount ?? (t as any).pnl),
          rr_ratio: parseSafeNumber(t.rr_ratio ?? (t as any).rr),
        };
      });

      setTrades(cleaned);
    } catch (err: any) {
      console.error('Error fetching trades:', err);
      setTrades([]);
      setError(err.message || 'An error occurred while fetching trades.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateTrade = useCallback(
    async (id: string, updates: any) => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase.from('trades').update(updates).eq('id', id);

        if (updateError) throw updateError;
        await fetchTrades();
      } catch (err: any) {
        console.error('Error updating trade:', err);
        toast.error('Failed to update trade record');
      }
    },
    [fetchTrades]
  );

  useEffect(() => {
    if (authLoading) return;
    void fetchTrades();
  }, [authLoading, fetchTrades]);

  const tradeRows = useMemo(
    () => mapDbTrades(trades as unknown as Record<string, unknown>[]),
    [trades]
  );
  const analytics = useMemo(() => computeTradeAnalytics(trades), [trades]);
  const insights = useMemo(() => generateTradeInsights(trades), [trades]);

  const value = useMemo<TradesContextValue>(
    () => ({
      trades,
      tradeRows,
      analytics,
      insights,
      isLoading: authLoading || isLoading,
      isEmpty: !authLoading && !isLoading && trades.length === 0,
      error,
      refetch: fetchTrades,
      updateTrade,
    }),
    [
      trades,
      tradeRows,
      analytics,
      insights,
      authLoading,
      isLoading,
      error,
      fetchTrades,
      updateTrade,
    ]
  );

  return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export function useTrades(): TradesContextValue {
  const context = useContext(TradesContext);
  if (!context) {
    throw new Error('useTrades must be used within TradesProvider');
  }
  return context;
}
