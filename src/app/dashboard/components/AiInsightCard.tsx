'use client';
import React, { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

// BACKEND: GET /api/ai-insights/weekly — replace with rule-based insight engine output
const insights = [
  {
    id: 'insight-001',
    type: 'positive' as const,
    icon: <CheckCircle2 size={13} />,
    text: 'Your win rate is 78% on Breakout trades — this is your strongest setup.',
  },
  {
    id: 'insight-002',
    type: 'warning' as const,
    icon: <AlertTriangle size={13} />,
    text: '3 revenge trades detected after consecutive losses. These lost $530 combined.',
  },
  {
    id: 'insight-003',
    type: 'negative' as const,
    icon: <TrendingDown size={13} />,
    text: 'Average RR ratio on Reversal trades is 0.7 — below your 1.5 minimum threshold.',
  },
  {
    id: 'insight-004',
    type: 'positive' as const,
    icon: <CheckCircle2 size={13} />,
    text: 'Crypto trades outperform Forex by +$1,420 this month. Consider shifting allocation.',
  },
];

const typeStyles = {
  positive: 'text-green-400 bg-green-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  negative: 'text-red-400 bg-red-500/10',
};

export default function AiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const visibleInsights = expanded ? insights : insights.slice(0, 2);

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <BrainCircuit size={15} className="text-violet-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">AI Coach</h4>
          <p className="text-xs text-muted-foreground">Weekly analysis</p>
        </div>
        <span className="text-xs bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full font-medium">
          {insights.length} insights
        </span>
      </div>

      <div className="space-y-2">
        {visibleInsights.map((insight) => (
          <div
            key={insight.id}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg ${typeStyles[insight.type]}`}
          >
            <span className="flex-shrink-0 mt-0.5">{insight.icon}</span>
            <p className="text-xs leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {expanded ? (
          <>Show less <ChevronUp size={12} /></>
        ) : (
          <>See all {insights.length} insights <ChevronDown size={12} /></>
        )}
      </button>
    </div>
  );
}