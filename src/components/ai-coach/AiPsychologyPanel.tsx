'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Flame, Frown, Smile } from 'lucide-react';
import type { EmotionAnalysis } from '@/types/ai';

interface AiPsychologyPanelProps {
  emotionAnalysis: EmotionAnalysis;
  personality: string;
}

export default function AiPsychologyPanel({
  emotionAnalysis,
  personality,
}: AiPsychologyPanelProps) {
  const topEmotion = emotionAnalysis.emotionDistribution[0] || { emotion: 'Neutral', count: 0 };
  const revengeCount = emotionAnalysis.revengeTradeCount;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-6">
        <BrainCircuit className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-foreground">Psychology Profile</h3>
      </div>

      <div className="flex-1 space-y-6">
        {/* Personality Badge */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-primary/10 border border-purple-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <BrainCircuit className="w-16 h-16" />
          </div>
          <p className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-wider">
            Trading Persona
          </p>
          <h4 className="text-xl font-bold text-foreground relative z-10">{personality}</h4>
        </div>

        {/* Emotion Stats */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Smile className="w-4 h-4" /> Dominant Emotion
              </span>
              <span className="font-semibold text-foreground capitalize">{topEmotion.emotion}</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, (topEmotion.count / (emotionAnalysis.emotionDistribution.reduce((a, b) => a + b.count, 0) || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Flame className="w-4 h-4" /> Revenge Trades
              </span>
              <span
                className={`font-semibold ${revengeCount > 0 ? 'text-loss' : 'text-emerald-500'}`}
              >
                {revengeCount} detected
              </span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${revengeCount > 2 ? 'bg-loss' : revengeCount > 0 ? 'bg-warning' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, revengeCount * 10)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Frown className="w-4 h-4" /> Calm Trade Win Rate
              </span>
              <span className="font-semibold text-foreground">
                {emotionAnalysis.calmTradeWinRate}%
              </span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-accent h-full rounded-full transition-all duration-1000"
                style={{ width: `${emotionAnalysis.calmTradeWinRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
