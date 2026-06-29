import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  id: string;
  label: string;
  value: string;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  icon: React.ReactNode;
  variant: 'profit' | 'loss' | 'info' | 'warning' | 'neutral';
  isHero?: boolean;
  isAlert?: boolean;
}

const variantStyles: Record<string, string> = {
  profit: 'gradient-profit',
  loss: 'gradient-loss',
  info: 'gradient-primary',
  warning: 'gradient-warning',
  neutral: '',
};

const iconBgStyles: Record<string, string> = {
  profit: 'bg-green-500/15 text-green-400',
  loss: 'bg-red-500/15 text-red-400',
  info: 'bg-blue-500/15 text-blue-400',
  warning: 'bg-amber-500/15 text-amber-400',
  neutral: 'bg-zinc-700/50 text-zinc-400',
};

const valueStyles: Record<string, string> = {
  profit: 'text-green-400', // Consistent green-400
  loss: 'text-red-400', // Consistent red-400
  info: 'text-blue-400', // Consistent blue-400
  warning: 'text-amber-400', // Consistent amber-400
  neutral: 'text-foreground',
};

export default function KpiCard({
  id,
  label,
  value,
  subtext,
  trend,
  trendValue,
  icon,
  variant,
  isHero = false,
  isAlert = false,
}: KpiCardProps) {
  const trendIcon =
    trend === 'up' ? (
      <TrendingUp size={12} />
    ) : trend === 'down' ? (
      <TrendingDown size={12} />
    ) : (
      <Minus size={12} />
    );

  const trendColor =
    trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div
      id={id}
      className={`relative card-premium h-full p-7 overflow-hidden ${
        isAlert ? 'border-amber-500/30' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
          {label}
        </p>
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner border border-white/[0.03] ${iconBgStyles[variant]}`}
        >
          {icon}
        </div>
      </div>

      <p
        className={`font-tabular font-bold ${isHero ? 'text-[44px] md:text-[56px]' : 'text-3xl md:text-4xl'} ${valueStyles[variant]} tracking-[-0.04em] leading-none mb-4`}
      >
        {value}
      </p>

      <div className="flex items-center gap-4">
        <p className="text-sm font-semibold text-muted-foreground/40 truncate flex-1">{subtext}</p>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[13px] font-bold ${trendColor}`}
        >
          {trendIcon}
          <span>{trendValue}</span>
        </div>
      </div>

      {isAlert && (
        <div className="mt-3 pt-3 border-t border-amber-500/20">
          <p className="text-xs text-amber-400 font-medium">⚠ Action needed — check AI Coach</p>
        </div>
      )}
    </div>
  );
}
