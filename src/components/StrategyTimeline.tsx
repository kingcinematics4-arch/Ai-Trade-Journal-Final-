'use client';
import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function StrategyTimeline({ timeline }: { timeline: any[] }) {
  return (
    <div className="card-premium p-6 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-50">
          Daily Strategy Flow
        </h3>
        <div className="p-2 rounded-lg bg-white/[0.03]">
          <Clock size={16} className="text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 scrollbar-none">
        {timeline.slice(0, 10).map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative pl-6 border-l border-white/[0.05]"
          >
            <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {format(new Date(day.date), 'dd MMMM yyyy')}
              </span>
              <span className="text-[10px] font-black text-muted-foreground bg-white/[0.03] px-2 py-0.5 rounded-full">
                {day.totalTrades} Trades
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {day.strategies.map((s: any) => (
                <div
                  key={s.name}
                  className="px-3 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center gap-2"
                >
                  <span className="text-[11px] font-bold text-slate-300">{s.name}</span>
                  <span className="text-[10px] font-black text-blue-500">{s.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
