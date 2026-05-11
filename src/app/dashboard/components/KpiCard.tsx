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
  profit: 'text-green-400',
  loss: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-amber-400',
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
    trend === 'up' ? <TrendingUp size={12} /> :
    trend === 'down' ? <TrendingDown size={12} /> :
    <Minus size={12} />;

  const trendColor =
    trend === 'up' ? 'text-green-400' :
    trend === 'down'? 'text-red-400' : 'text-muted-foreground';

  return (
    <div
      id={id}
      className={`card-elevated card-hover h-full p-5 ${variantStyles[variant]} ${
        isAlert ? 'border-amber-500/30' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgStyles[variant]}`}>
          {icon}
        </div>
      </div>

      <p className={`font-tabular font-bold ${isHero ? 'text-4xl' : 'text-2xl'} ${valueStyles[variant]} mb-1`}>
        {value}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground flex-1 min-w-0">{subtext}</p>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor} flex-shrink-0`}>
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