'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import GoalSelector from './GoalSelector';
import { useTrades } from '@/contexts/TradesContext';
import { useGoalsStore } from '@/stores/useGoalsStore';
import type { DbTrade } from '@/lib/trades/types';

interface EditTradeModalProps {
  trade: DbTrade & { goalId?: string };
  onClose: () => void;
}

export default function EditTradeModal({ trade, onClose }: EditTradeModalProps) {
  const { updateTrade, trades } = useTrades();
  const syncProgress = useGoalsStore(state => state.syncProgress);
  
  const [formData, setFormData] = useState({
    pair: trade.pair || '',
    entry_price: trade.entry_price || '',
    exit_price: trade.exit_price || '',
    pnl: trade.pnl || 0,
    notes: trade.notes || '',
    goalId: trade.goalId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Task 5: Temporary debug logs
    console.log('[EditTrade] Form Data Submitted:', formData);
    console.log('[EditTrade] Original Trade State:', trade);
    
    // Task 2: Ensure goalId is cleaned (empty string from select -> undefined)
    const updatedData = { 
      ...formData,
      goalId: formData.goalId || undefined 
    };

    await updateTrade(trade.id, updatedData);
    
    // Force goal recalculation with the updated trade list
    const updatedTrade = { ...trade, ...updatedData };
    const nextTrades = trades.map(t => t.id === trade.id ? updatedTrade : t);
    syncProgress(nextTrades as any);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-foreground">Edit Trade</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Pair</label>
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition-colors"
                value={formData.pair}
                onChange={e => setFormData({ ...formData, pair: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">PnL ($)</label>
              <input 
                type="number"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition-colors"
                value={formData.pnl}
                onChange={e => setFormData({ ...formData, pnl: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Entry</label>
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none"
                value={formData.entry_price}
                onChange={e => setFormData({ ...formData, entry_price: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Exit</label>
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none"
                value={formData.exit_price}
                onChange={e => setFormData({ ...formData, exit_price: e.target.value })}
              />
            </div>
          </div>

          <GoalSelector 
            value={formData.goalId} 
            onChange={val => setFormData({ ...formData, goalId: val })} 
          />

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}