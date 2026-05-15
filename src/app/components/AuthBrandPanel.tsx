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
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-20 right-10 w-64 h-64 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
        />
      </div>
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
      {/* Stats row */}
      <div className="relative z-10 flex gap-6">
        {[
          { id: 'stat-traders', value: '2,400+', label: 'Active Traders' },
          { id: 'stat-trades', value: '48K+', label: 'Trades Logged' },
          { id: 'stat-improvement', value: '+23%', label: 'Avg Win Rate Gain' },
        ]?.map((stat) => (
          <div key={stat?.id}>
            <p className="text-xl font-bold text-foreground font-tabular">{stat?.value}</p>
            <p className="text-xs text-muted-foreground">{stat?.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
