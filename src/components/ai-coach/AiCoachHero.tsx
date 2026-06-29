'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Activity } from 'lucide-react';

interface AiCoachHeroProps {
  overallScore: number;
  winRate: number;
  recentPnl: number;
  streak: number;
}

export default function AiCoachHero({
  overallScore,
  winRate,
  recentPnl,
  streak,
}: AiCoachHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 md:p-10 shadow-lg"
    >
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
            <Brain className="w-4 h-4" />
            AI Trading Intelligence
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Your Performance is{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Improving
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Based on your recent trades, your discipline is strong. Keep managing your risk properly
            and you'll hit your monthly targets.
          </p>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="w-4 h-4 text-primary" />
              Overall Score
            </div>
            <span className="text-2xl font-bold text-foreground">{overallScore}%</span>
          </div>
          <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="w-4 h-4 text-accent" />
              Win Rate
            </div>
            <span className="text-2xl font-bold text-foreground">{winRate.toFixed(1)}%</span>
          </div>
          <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className={`w-4 h-4 ${recentPnl >= 0 ? 'text-profit' : 'text-loss'}`} />
              Recent PnL
            </div>
            <span className={`text-2xl font-bold ${recentPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              ${Math.abs(recentPnl).toFixed(2)}
            </span>
          </div>
          <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 rounded-full bg-warning/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              </div>
              Streak
            </div>
            <span className="text-2xl font-bold text-foreground">{streak}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
