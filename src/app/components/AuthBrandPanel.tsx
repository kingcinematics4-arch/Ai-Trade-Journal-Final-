'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AppLogo from '@/components/ui/AppLogo';
import { 
  TrendingUp, 
  BrainCircuit, 
  BarChart3, 
  Brain, 
  Quote, 
  ArrowUpRight, 
  CheckCircle2, 
  Activity 
} from 'lucide-react';

const features = [
  {
    id: 'feat-journal',
    icon: <TrendingUp size={18} className="text-blue-400" />,
    title: 'Detailed Trade Logging',
    desc: 'Capture execution, visual charts, custom metrics, and emotional states.',
    glowColor: 'group-hover:border-blue-500/30 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
  },
  {
    id: 'feat-ai',
    icon: <BrainCircuit size={18} className="text-emerald-400" />,
    title: 'Personalized Coaching',
    desc: 'AI-driven rule audits to detect patterns, blindspots, and rule-breaks.',
    glowColor: 'group-hover:border-emerald-500/30 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.15)]',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  },
  {
    id: 'feat-analytics',
    icon: <BarChart3 size={18} className="text-amber-400" />,
    title: 'Performance Analytics',
    desc: 'Unlock win rates, R:R metrics, strategy performance, and setup tracking.',
    glowColor: 'group-hover:border-amber-500/30 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  },
  {
    id: 'feat-psychology',
    icon: <Brain size={18} className="text-violet-400" />,
    title: 'Psychology Tracking',
    desc: 'Identify emotional triggers, avoid trading tilt, and build solid discipline.',
    glowColor: 'group-hover:border-violet-500/30 group-hover:shadow-[0_0_15px_rgba(167,139,250,0.15)]',
    iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
  },
];

// High fidelity realistic mock candlestick chart data
const chartCandles = [
  { x: 30, open: 110, close: 95, high: 120, low: 90, isGreen: false },
  { x: 75, open: 95, close: 125, high: 130, low: 90, isGreen: true },
  { x: 120, open: 125, close: 115, high: 135, low: 110, isGreen: false },
  { x: 165, open: 115, close: 140, high: 145, low: 105, isGreen: true },
  { x: 210, open: 140, close: 130, high: 148, low: 125, isGreen: false },
  { x: 255, open: 130, close: 160, high: 165, low: 120, isGreen: true },
  { x: 300, open: 160, close: 180, high: 185, low: 155, isGreen: true },
  { x: 345, open: 180, close: 170, high: 190, low: 165, isGreen: false },
  { x: 390, open: 170, close: 200, high: 205, low: 160, isGreen: true },
  { x: 435, open: 200, close: 225, high: 235, low: 195, isGreen: true },
];

export default function AuthBrandPanel() {
  // SVG path generation for the neon line chart
  const pathD = chartCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.close}`).join(' ');

  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-8 xl:p-10 bg-gradient-to-b from-[#030712] via-[#090d16] to-[#030712] border-r border-white/[0.05] overflow-hidden h-full">
      
      {/* Subtle moving grid background */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
        }}
      />

      {/* Floating Ambient Glowing Radial Lights */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-[120px] h-[120px] rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none" />

      {/* Top Section: Logo Branding */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <AppLogo size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight font-sans">AITradeJournal</span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">PRO</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Smart journaling for institutional performance</p>
          </div>
        </div>
      </div>

      {/* Middle Section: Hero Copy & Candlestick Chart */}
      <div className="relative z-10 my-auto py-6 space-y-8">
        
        {/* Hero Title */}
        <div className="space-y-3 max-w-lg">
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.15] tracking-tight">
            Stop guessing.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
              Start understanding
            </span>{' '}
            your trades.
          </h1>
          <p className="text-slate-400 text-xs xl:text-sm leading-relaxed font-medium">
            Log your executions, track emotional triggers, and let our rule-based AI isolate structural flaws costing you money—before they become habits.
          </p>
        </div>

        {/* Realistic Candlestick Trading Chart Hero Section */}
        <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-slate-950/40 backdrop-blur-md p-4 shadow-2xl overflow-hidden group">
          
          {/* Subtle overlay reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-white/[0.03] pointer-events-none" />

          {/* Chart Header Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">BTC/USD 1H Chart</span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium bg-emerald-500/10 px-2 py-0.5 rounded">+$4,820.50 (+4.82%)</span>
            </div>
            <div className="flex gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            </div>
          </div>

          {/* SVG Animated Candlestick Chart */}
          <div className="relative h-[130px] w-full flex items-end">
            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 480 240" 
              preserveAspectRatio="none"
            >
              {/* Horizontal grid guide lines */}
              <line x1="0" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="180" x2="480" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Volume Bars Background */}
              {chartCandles.map((c, i) => (
                <rect
                  key={`vol-${i}`}
                  x={c.x - 6}
                  y={240 - (c.high - c.low) * 0.4}
                  width={12}
                  height={(c.high - c.low) * 0.4}
                  fill={c.isGreen ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)'}
                  rx="1"
                />
              ))}

              {/* Candles (Wicks + Bodies) */}
              {chartCandles.map((c, i) => (
                <g key={`candle-${i}`}>
                  {/* Wick (High to Low) */}
                  <motion.line
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    x1={c.x}
                    y1={c.high}
                    x2={c.x}
                    y2={c.low}
                    stroke={c.isGreen ? '#10b981' : '#ef4444'}
                    strokeWidth="1.5"
                    className="origin-center"
                  />
                  {/* Body (Open to Close) */}
                  <motion.rect
                    initial={{ scaleY: 0, y: c.isGreen ? c.close : c.open }}
                    animate={{ scaleY: 1, y: c.isGreen ? c.close : c.open }}
                    transition={{ duration: 0.5, delay: i * 0.05 + 0.2 }}
                    x={c.x - 5}
                    y={c.isGreen ? c.close : c.open}
                    width={10}
                    height={Math.max(Math.abs(c.close - c.open), 4)}
                    fill={c.isGreen ? '#10b981' : '#ef4444'}
                    filter={`drop-shadow(0 0 4px ${c.isGreen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'})`}
                    rx="1.5"
                    className="origin-center"
                  />
                </g>
              ))}

              {/* Neon Price Line Overlay */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                d={pathD}
                fill="none"
                stroke="url(#neon-line-grad)"
                strokeWidth="2.5"
                filter="drop-shadow(0 2px 8px rgba(56,189,248,0.4))"
              />

              {/* Leading price dot pulse */}
              {chartCandles.length > 0 && (
                <g transform={`translate(${chartCandles[chartCandles.length - 1].x}, ${chartCandles[chartCandles.length - 1].close})`}>
                  <circle r="4" fill="#38bdf8" />
                  <motion.circle
                    r="9"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  />
                </g>
              )}

              {/* Gradients */}
              <defs>
                <linearGradient id="neon-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating Widget 1: Profit Alert badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className="absolute top-[45px] right-[15px] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.15)] cursor-pointer"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <ArrowUpRight size={12} className="stroke-[3px]" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-sans">Payout Target</p>
              <p className="text-xs font-mono font-bold text-emerald-400">+$2,450.00</p>
            </div>
          </motion.div>

          {/* Floating Widget 2: Risk Reward badge */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className="absolute bottom-[25px] left-[15px] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-blue-500/20 px-3 py-1.5 rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.15)] cursor-pointer"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <CheckCircle2 size={12} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-sans">Setup Ratio</p>
              <p className="text-xs font-mono font-bold text-blue-400">R:R 1 : 3.5</p>
            </div>
          </motion.div>

          {/* Floating Widget 3: Live Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.7, duration: 0.5 }}
            className="absolute top-[100px] left-[175px] pointer-events-none hidden md:flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-sm border border-white/[0.04] px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400"
          >
            <Activity size={10} className="text-cyan-400 animate-pulse" />
            <span>Volume: 124.8K</span>
          </motion.div>
        </div>

        {/* 4 Feature Cards (Glassmorphism layout - Compact 2x2 grid) */}
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          {features.map((feat, idx) => (
            <motion.div
              key={feat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
              whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              className={`flex items-start gap-3 p-3 rounded-xl border border-white/[0.03] bg-white/[0.015] backdrop-blur-sm transition-all duration-200 cursor-pointer group ${feat.glowColor}`}
            >
              <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${feat.iconBg}`}>
                {feat.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-white tracking-wide truncate">{feat.title}</h4>
                  <ArrowUpRight size={10} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-normal line-clamp-2">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Premium Testimonial */}
      <div className="relative z-10 max-w-lg mt-auto pt-4 border-t border-white/[0.05]">
        <div className="relative bg-white/[0.015] backdrop-blur-sm border border-white/[0.04] rounded-2xl p-3.5 shadow-xl">
          <Quote className="absolute -top-3 -left-1 text-blue-500/20 fill-blue-500/5 stroke-[1.5px]" size={30} />
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic relative z-10">
            &ldquo;AITradeJournal completely overhauled my discipline. The AI isolated that my Friday trading sessions had a 28% lower win rate. Cutting that window alone saved me thousands in capital.&rdquo;
          </p>
          <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-white/[0.04]">
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-extrabold text-white shadow-md border border-blue-400/20">
              SJ
            </div>
            <div>
              <p className="text-[10px] font-bold text-white tracking-wide">Sarah Jenkins</p>
              <p className="text-[8px] text-slate-400 font-medium">Professional FX Futures Trader</p>
            </div>
            <div className="ml-auto flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-2 w-2 text-amber-400 fill-amber-400 shadow-glow" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
