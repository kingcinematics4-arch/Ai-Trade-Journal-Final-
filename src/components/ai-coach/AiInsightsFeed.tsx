'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, Zap } from 'lucide-react';
import type { AiCoachFeedback } from '@/types/ai';

interface AiInsightsFeedProps {
  feedback: AiCoachFeedback[];
  onInsightClick?: (insight: AiCoachFeedback) => void;
}

export default function AiInsightsFeed({ feedback, onInsightClick }: AiInsightsFeedProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'negative':
        return <AlertOctagon className="w-5 h-5 text-loss" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'warning':
        return 'border-warning/30 bg-warning/5';
      case 'negative':
        return 'border-loss/30 bg-loss/5';
      default:
        return 'border-primary/30 bg-primary/5';
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Live AI Insights</h3>
      </div>

      {feedback.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Not enough data yet. Keep trading to get personalized insights.
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {feedback.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              onClick={() => onInsightClick?.(item)}
              className={`flex items-start gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all hover:bg-background/80 cursor-pointer hover:scale-[1.01] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background ${getBorderColor(item.type)}`}
              role={onInsightClick ? 'button' : undefined}
              tabIndex={onInsightClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onInsightClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onInsightClick(item);
                }
              }}
              aria-label={onInsightClick ? `View ${item.category} insight details` : undefined}
            >
              <div className="mt-0.5 shrink-0">{getIcon(item.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {item.message}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
