'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, BarChart2, DollarSign, ArrowUp, ArrowDown, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface StrategyDetailsModalProps {
  strategy: any; // Use a more specific type if available
  isOpen: boolean;
  onClose: () => void;
}

export default function StrategyDetailsModal({ strategy, isOpen, onClose }: StrategyDetailsModalProps) {
  if (!strategy) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const pnlColorClass = strategy.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
        >
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="relative bg-slate-900 border border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            variants={modalVariants}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/[0.05]">
              <h2 className="text-2xl font-bold text-white tracking-tight">{strategy.name} Details</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.05] transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="card-premium p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Trades</p>
                  <h4 className="text-xl font-bold text-white mt-2">{strategy.totalTrades}</h4>
                </div>
                <div className="card-premium p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Win Rate</p>
                  <h4 className="text-xl font-bold text-blue-500 mt-2">{strategy.winRate.toFixed(1)}%</h4>
                </div>
                <div className="card-premium p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Net PnL</p>
                  <h4 className={`text-xl font-bold ${pnlColorClass} mt-2`}>${strategy.netPnL.toLocaleString()}</h4>
                </div>
                <div className="card-premium p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg Trade</p>
                  <h4 className="text-xl font-bold text-white mt-2">${(strategy.netPnL / strategy.totalTrades).toFixed(2)}</h4>
                </div>
                <div className="card-premium p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Largest Win</p>
                  <h4 className="text-xl font-bold text-emerald-500 mt-2">${strategy.largestWin.toFixed(2)}</h4>
                </div>
                <div className="card-premium p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Largest Loss</p>
                  <h4 className="text-xl font-bold text-rose-500 mt-2">${strategy.largestLoss.toFixed(2)}</h4>
                </div>
              </div>

              {/* Recent Trades (Placeholder) */}
              <div className="card-premium p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CalendarDays size={20} className="text-blue-500" /> Recent Trades
                </h3>
                {strategy.trades && strategy.trades.length > 0 ? (
                  <ul className="space-y-3">
                    {strategy.trades.slice(0, 5).map((trade: any) => (
                      <li key={trade.id} className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                        <span className="text-sm font-medium text-white">{trade.trade_title}</span>
                        <span className={`text-sm font-bold ${parseFloat(trade.pnl_amount) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ${parseFloat(trade.pnl_amount).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No recent trades for this strategy.</p>
                )}
              </div>

              {/* Monthly Performance (Placeholder) */}
              <div className="card-premium p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart2 size={20} className="text-blue-500" /> Monthly Performance
                </h3>
                <p className="text-muted-foreground text-sm">Monthly performance chart for {strategy.name} would go here.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}