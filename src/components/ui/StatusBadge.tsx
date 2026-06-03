import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'win'
  | 'loss'
  | 'breakeven'
  | 'active'
  | 'pending'
  | 'buy'
  | 'sell'
  | 'warning'
  | 'info';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

const variantMap: Record<BadgeVariant, string> = {
  win: 'bg-green-500/15 text-green-400 border border-green-500/20',
  loss: 'bg-red-500/15 text-red-400 border border-red-500/20',
  breakeven: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20',
  active: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  buy: 'bg-green-500/15 text-green-400 border border-green-500/20',
  sell: 'bg-red-500/15 text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
};

const defaultLabels: Record<BadgeVariant, string> = {
  win: 'Win',
  loss: 'Loss',
  breakeven: 'B/E',
  active: 'Active',
  pending: 'Pending',
  buy: 'Buy',
  sell: 'Sell',
  warning: 'Warning',
  info: 'Info',
};

export default function StatusBadge({ 
  variant, 
  label, 
  size = 'sm', 
  className, 
  ...props 
}: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span 
      className={cn(
        'status-badge font-medium rounded-full', 
        variantMap[variant], 
        sizeClass, 
        className
      )}
      {...props}
    >
      {label ?? defaultLabels[variant]}
    </span>
  );
}
