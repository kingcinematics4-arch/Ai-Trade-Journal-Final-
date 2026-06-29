'use client';
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import StrategyDetailsModal from './StrategyDetailsModal';

export default function StrategyTable({
  strategies,
  searchTerm,
}: {
  strategies: any[];
  searchTerm: string;
}) {
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

  const filtered = strategies.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/[0.02] border-b border-white/[0.05]">
            {[
              'Strategy',
              'Trades',
              'W / L / B',
              'Win Rate',
              'Avg Profit',
              'Net PnL',
              'PF',
              'Last Used',
            ].map((header) => (
              <th
                key={header}
                className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {filtered.map((s) => (
            <tr
              key={s.name}
              onClick={() => setSelectedStrategy(s)}
              className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              <td className="px-6 py-4">
                <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  {s.name}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{s.totalTrades}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className="text-emerald-500">{s.wins}</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-rose-500">{s.losses}</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-slate-400">{s.breakevens}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${s.winRate}%` }} />
                  </div>
                  <span className="text-xs font-black text-white">{s.winRate.toFixed(1)}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs font-bold ${s.avgProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                >
                  ${s.avgProfit.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  {s.netPnL > 0 ? (
                    <ArrowUpRight size={14} className="text-emerald-500" />
                  ) : s.netPnL < 0 ? (
                    <ArrowDownRight size={14} className="text-rose-500" />
                  ) : (
                    <Minus size={14} className="text-slate-400" />
                  )}
                  <span
                    className={`text-sm font-black ${s.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    ${s.netPnL.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded ${s.profitFactor >= 2 ? 'bg-emerald-500/10 text-emerald-500' : s.profitFactor >= 1 ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}
                >
                  {s.profitFactor.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                  {format(new Date(s.lastUsed), 'MMM dd, yyyy')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedStrategy && (
        <StrategyDetailsModal
          strategy={selectedStrategy}
          isOpen={!!selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </div>
  );
}
