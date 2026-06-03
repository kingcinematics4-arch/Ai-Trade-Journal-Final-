'use client';

import React from 'react';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useTrades } from '@/contexts/TradesContext';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatCard({ icon, label, value, sub, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4 sm:p-5">
      <div className={`${color} opacity-70`}>{icon}</div>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProfileStats() {
  const { dbProfile } = useProfileContext();
  const { trades } = useTrades();

  // Compute stats from trades context
  const totalTrades = trades?.length ?? 0;
  const wins = trades?.filter((t) => (t.pnl_amount ?? 0) > 0).length ?? 0;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  const joinedDate = dbProfile?.createdAt
    ? new Date(dbProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
      <StatCard
        icon={<BarChart2 size={18} />}
        label="Total Trades"
        value={totalTrades.toString()}
        sub="all time"
        color="text-blue-400"
      />
      <StatCard
        icon={<TrendingUp size={18} />}
        label="Win Rate"
        value={`${winRate}%`}
        sub={`${wins} wins`}
        color="text-emerald-400"
      />
      <StatCard
        icon={<Calendar size={18} />}
        label="Member Since"
        value={joinedDate}
        sub="joined"
        color="text-violet-400"
      />
    </div>
  );
}
