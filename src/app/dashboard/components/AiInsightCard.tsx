'use client';

import React, { useState } from 'react';
import {
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useTrades } from '@/contexts/TradesContext';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const typeStyles = {
  positive: 'text-green-400 bg-green-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  negative: 'text-red-400 bg-red-500/10',
};

const typeIcons = {
  positive: <CheckCircle2 size={13} />,
  warning: <AlertTriangle size={13} />,
  negative: <TrendingDown size={13} />,
};

export default function AiInsightCard() {
  const { insights, isLoading, isEmpty } = useTrades();
  const [expanded, setExpanded] = useState(false);
  const visibleInsights = expanded ? insights : insights.slice(0, 2);

  if (isLoading) {
    return (
      <div className="card-elevated p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isEmpty || insights.length === 0) {
    return (
      <div className="card-elevated p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <BrainCircuit size={15} className="text-violet-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">AI Coach</h4>
            <p className="text-xs text-muted-foreground">Insights from your journal</p>
          </div>
        </div>
        <EmptyState
          title="No insights yet"
          description="Log at least two trades to unlock pattern-based coaching from your own data."
          actionLabel="Add a trade"
          actionHref="/add-trade"
          className="py-6"
        />
      </div>
    );
  }

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <BrainCircuit size={15} className="text-violet-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">AI Coach</h4>
          <p className="text-xs text-muted-foreground">From your logged trades</p>
        </div>
        <span className="text-xs bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full font-medium">
          {insights.length} insight{insights.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-2">
        {visibleInsights.map((insight) => (
          <div
            key={insight.id}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg ${typeStyles[insight.type]}`}
          >
            <span className="flex-shrink-0 mt-0.5">{typeIcons[insight.type]}</span>
            <p className="text-xs leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>

      {insights.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {expanded ? (
            <>
              Show less <ChevronUp size={12} />
            </>
          ) : (
            <>
              See all {insights.length} insights <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
