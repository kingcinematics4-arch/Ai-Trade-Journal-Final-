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
  const syncProgress = useGoalsStore((state) => state.syncProgress);

  const [formData, setFormData] = useState({
    asset_name: trade.asset_name || '',
    entry_price: String(trade.entry_price ?? ''),
    exit_price: String(trade.exit_price ?? ''),
    pnl_amount: String(trade.pnl_amount ?? 0),
    notes: trade.notes || '',
    goal_id: (trade as any).goal_id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize data: Ensure prices and PnL are numbers for the database
    const updatedData = {
      ...formData,
      pnl_amount: Number(formData.pnl_amount) || 0,
      entry_price: parseFloat(formData.entry_price) || 0,
      exit_price: parseFloat(formData.exit_price) || 0,
      goal_id: formData.goal_id || null,
    };

    await updateTrade(String(trade.id), updatedData);

    // Optimistically update goals with the fresh trade data
    const updatedTrade = { ...trade, ...updatedData };
    const nextTrades = trades.map((t) => (String(t.id) === String(trade.id) ? updatedTrade : t));
    syncProgress(nextTrades as any);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-foreground">Edit Trade</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Asset Name</label>
              <input
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition-colors"
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">PnL ($)</label>
              <input
                type="number"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition-colors"
                value={formData.pnl_amount}
                onChange={(e) => setFormData({ ...formData, pnl_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Entry</label>
              <input
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none"
                value={formData.entry_price}
                onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Exit</label>
              <input
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none"
                value={formData.exit_price}
                onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
              />
            </div>
          </div>

          <GoalSelector
            value={formData.goal_id}
            onChange={(val) => setFormData({ ...formData, goal_id: val })}
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
