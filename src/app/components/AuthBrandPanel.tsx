import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { TrendingUp, BrainCircuit, BarChart3, Shield } from 'lucide-react';

const features = [
  {
    id: 'feat-journal',
    icon: <TrendingUp size={16} className="text-primary" />,
    title: 'Detailed Trade Logging',
    desc: 'Capture every detail — entry, exit, emotions, screenshots',
  },
  {
    id: 'feat-ai',
    icon: <BrainCircuit size={16} className="text-accent" />,
    title: 'AI-Powered Coaching',
    desc: 'Rule-based insights that identify your patterns and mistakes',
  },
  {
    id: 'feat-analytics',
    icon: <BarChart3 size={16} className="text-amber-400" />,
    title: 'Performance Analytics',
    desc: 'Win rate, RR ratio, strategy breakdown, emotion impact',
  },
  {
    id: 'feat-goals',
    icon: <Shield size={16} className="text-violet-400" />,
    title: 'Discipline Tracking',
    desc: 'Set goals, track streaks, build trading discipline',
  },
];

export default function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-zinc-900 via-zinc-950 to-background border-r border-border overflow-hidden">
      {/* Background decoration */}
      
      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <AppLogo size={40} />
          <div>
            <span className="font-bold text-xl text-foreground">AITradeJournal</span>
            <p className="text-xs text-muted-foreground">Smart journaling for serious traders</p>
          </div>
        </div>
      </div>
      {/* Hero Copy */}
      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="text-3xl xl:text-4xl font-bold text-foreground leading-tight mb-3">
            Stop guessing.
            <br />
            <span className="text-primary">Start understanding</span>
            <br />
            your trades.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            Log every trade, track your psychology, and let AI find the patterns costing you money —
            before they become habits.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3">
          {features?.map((feat) => (
            <div key={feat?.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                {feat?.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{feat?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{feat?.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-sm text-muted-foreground max-w-sm">
          Your journal starts empty. Every metric, chart, and insight is built only from trades you log.
        </p>
      </div>
    </div>
  );
}
