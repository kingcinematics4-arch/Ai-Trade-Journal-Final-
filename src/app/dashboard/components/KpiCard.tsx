import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  onClick?: () => void;
  href?: string;
}

/**
 * Adaptive font sizing based on value length
 * Returns appropriate Tailwind text size class
 */
function getAdaptiveFontSize(value: string, isHero: boolean = false): string {
  const length = value.length;

  if (isHero) {
    // Hero cards (larger base size)
    if (length <= 8) return 'text-5xl';
    if (length <= 12) return 'text-4xl';
    if (length <= 16) return 'text-3xl';
    return 'text-2xl';
  }

  // Standard cards
  if (length <= 6) return 'text-4xl';
  if (length <= 10) return 'text-3xl';
  if (length <= 14) return 'text-2xl';
  return 'text-xl';
}

/**
 * Adaptive subtitle font sizing based on text length
 * Returns appropriate Tailwind text size class
 */
function getAdaptiveSubtitleSize(text: string): string {
  const length = text.length;
  if (length <= 20) return 'text-xs';
  if (length <= 35) return 'text-[11px]';
  return 'text-[10px]';
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
  onClick,
  href,
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

  const fontSize = getAdaptiveFontSize(value, isHero);
  const subtitleSize = getAdaptiveSubtitleSize(subtext);

  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-5">
        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
          {label}
        </p>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-white/[0.05] ${iconBgStyles[variant]}`}
        >
          {icon}
        </div>
      </div>

      <p
        className={cn(
          'font-tabular font-bold whitespace-nowrap tracking-[-0.03em] leading-none mb-4',
          fontSize,
          valueStyles[variant]
        )}
      >
        {value}
      </p>

      <div className="flex items-start gap-3">
        <p className={cn('font-medium text-muted-foreground/60 leading-tight', subtitleSize, 'flex-1')}>
          {subtext}
        </p>
        {trendValue && trendValue !== '—' && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] font-semibold whitespace-nowrap flex-shrink-0 ${trendColor}`}
          >
            {trendIcon}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {isAlert && (
        <div className="mt-3 pt-3 border-t border-amber-500/20">
          <p className="text-xs text-amber-400 font-medium">Action needed — check AI Coach</p>
        </div>
      )}
    </>
  );

  const cardClassName = cn(
    'relative card-premium h-full p-6 overflow-hidden transition-all duration-200',
    isAlert ? 'border-amber-500/30' : '',
    (href || onClick) && 'hover:scale-[1.01] hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background'
  );

  if (href) {
    return (
      <Link
        id={id}
        href={href}
        className={cardClassName}
        aria-label={`View ${label} details`}
      >
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        id={id}
        onClick={onClick}
        className={cn(cardClassName, 'text-left w-full')}
        aria-label={`View ${label} details`}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div
      id={id}
      className={cardClassName}
    >
      {cardContent}
    </div>
  );
}
