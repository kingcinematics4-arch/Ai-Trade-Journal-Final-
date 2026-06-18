'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  BookOpen,
  BrainCircuit,
  BarChart3,
  Download,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Layers,
  ShieldCheck
} from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import LegalSection from '@/components/LegalSection'; // Added missing import
import AuthScreen from './components/AuthScreen';

// Reusable Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const scrollReveal = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

const cardHover = {
  scale: 1.05,
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 17
  }
};

const bounceIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const features = [
  // 1. Trade Journal (Replaces "Trade Logging")
  {
    title: "Trade Journal",
    description: "Record every trade with entry, exit, notes, emotions and execution details in a structured journal.",
    icon: <BookOpen className="text-blue-400" />,
    preview: (
      <div className="relative w-full h-full bg-slate-900 rounded-lg p-3 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-300">Recent Trades</span>
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-2 p-1.5 bg-slate-800 rounded-md">
            <div className="w-3 h-3 bg-emerald-500/20 rounded-sm" />
            <span className="text-[9px] font-medium text-slate-400">BTC/USD Long +$120</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-slate-800 rounded-md">
            <div className="w-3 h-3 bg-red-500/20 rounded-sm" />
            <span className="text-[9px] font-medium text-slate-400">ETH/USDT Short -$50</span>
          </div>
        </div>
        <div className="flex-1 bg-slate-800 rounded-md p-2 text-[9px] text-slate-500 leading-tight">
          "Entry was perfect, but exited too early due to FOMO. Need to trust the plan more..."
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {['#breakout', '#fomo', '#long'].map((tag, i) => (
            <span key={i} className="text-[8px] bg-blue-500/10 text-blue-300 px-1 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  },
  // 2. AI Coach (Replaces "AI Analysis")
  {
    title: "AI Coach",
    description: "AI-powered trading psychology and performance analysis that identifies strengths, weaknesses and behavioral patterns.",
    icon: <BrainCircuit className="text-emerald-400" />,
    preview: (
      <div className="relative w-full h-full bg-slate-900 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-300">AI Insights</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-2 p-1.5 bg-emerald-500/10 rounded-md text-[9px] text-emerald-300">
            <CheckCircle2 size={11} />
            <span className="font-medium">Strong discipline on entries.</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-red-500/10 rounded-md text-[9px] text-red-300">
            <TrendingDown size={11} />
            <span className="font-medium">Overtrading on Tuesdays.</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
          <span className="text-[9px] text-slate-500 uppercase font-bold">Psychology Score</span>
          <span className="text-sm font-bold text-emerald-400">85/100</span>
        </div>
      </div>
    )
  },
  // 3. Strategy Management (Replaces "Strategy Tracking")
  {
    title: "Strategy Management",
    description: "Create, organize, test and track trading strategies with detailed performance statistics and historical results.",
    icon: <Layers className="text-indigo-400" />, // Changed icon from Target to Layers
    preview: (
      <div className="relative w-full h-full bg-slate-900 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-300">Top Strategies</span>
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
        </div>
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center justify-between p-1.5 bg-slate-800 rounded-md">
            <span className="text-[9px] font-medium text-slate-400">Breakout</span>
            <span className="text-[9px] font-bold text-emerald-400">68% WR</span>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-slate-800 rounded-md">
            <span className="text-[9px] font-medium text-slate-400">Trend Follow</span>
            <span className="text-[9px] font-bold text-blue-400">55% WR</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
          <span className="text-[9px] text-slate-500 uppercase font-bold">Backtest</span>
          <span className="text-xs font-bold text-white">3 active</span>
        </div>
      </div>
    )
  },
  // 4. Advanced Analytics
  {
    title: "Advanced Analytics",
    description: "Deep analytics including equity curve, win rate, profit factor, drawdown, expectancy and performance metrics.",
    icon: <BarChart3 className="text-purple-400" />,
    preview: (
      <div className="relative w-full h-full bg-slate-900 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-300">Equity Curve</span>
          <div className="w-2 h-2 rounded-full bg-purple-500" />
        </div>
        <div className="relative h-24 w-full mb-2">
          <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 L10,35 L20,38 L30,30 L40,32 L50,25 L60,28 L70,20 L80,22 L90,15 L100,18" fill="none" stroke="url(#equityGradient)" strokeWidth="1.5" />
            <defs>
              <linearGradient id="equityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase font-bold">Win Rate</span>
            <span className="text-sm font-bold text-emerald-400">62%</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-slate-500 uppercase font-bold">Max DD</span>
            <span className="text-sm font-bold text-red-400">-$500</span>
          </div>
        </div>
      </div>
    )
  },
  // 5. Risk Management
  {
    title: "Risk Management",
    description: "Monitor R-multiple and portfolio heat. Ensure survival with institutional-grade risk oversight.",
    icon: <ShieldCheck className="text-rose-400" />,
    preview: (
      <div className="relative w-full h-full bg-slate-900 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-300">Risk Metrics</span>
          <div className="w-2 h-2 rounded-full bg-rose-500" />
        </div>
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center justify-between p-1.5 bg-slate-800 rounded-md">
            <span className="text-[9px] font-medium text-slate-400">Avg R-Multiple</span>
            <span className="text-[9px] font-bold text-emerald-400">1.8R</span>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-slate-800 rounded-md">
            <span className="text-[9px] font-medium text-slate-400">Max Loss</span>
            <span className="text-[9px] font-bold text-red-400">-$150</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
          <span className="text-[9px] text-slate-500 uppercase font-bold">Portfolio Heat</span>
          <span className="text-sm font-bold text-white">2.5%</span>
        </div>
      </div>
    )
  },
  // 6. Export Engine (Replaces "Institutional Export")
  {
    title: "Export Engine",
    description: "Generate professional PDF or XLSX reports for performance reviews or tax compliance.",
    icon: <Download className="text-amber-400" />,
    preview: (
      <div className="relative w-full h-full bg-slate-900 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-300">Export Options</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {['Excel', 'PDF', 'CSV', 'JSON'].map((format, i) => (
            <div key={i} className="flex items-center gap-1 p-1.5 bg-slate-800 rounded-md text-[9px] font-medium text-slate-400">
              <span className="w-3 h-3 bg-blue-500/20 rounded-sm flex items-center justify-center text-blue-400">
                {format === 'Excel' ? 'X' : format === 'PDF' ? 'P' : format === 'CSV' ? 'C' : 'J'}
              </span>
              {format}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800">
          <span className="text-[9px] text-slate-500 uppercase font-bold">File Name</span>
          <span className="text-xs font-bold text-white">Trades_Report.xlsx</span>
        </div>
      </div>
    )
  }
];

export default function LandingPage() {
  // Scroll-reactive refs
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: false, amount: 0.2 });

  const previewRef = useRef(null);
  const isPreviewInView = useInView(previewRef, { once: false, amount: 0.2 });

  const featuresHeaderRef = useRef(null);
  const isFeaturesHeaderInView = useInView(featuresHeaderRef, { once: false, amount: 0.5 });

  const featuresGridRef = useRef(null);
  const isFeaturesGridInView = useInView(featuresGridRef, { once: false, amount: 0.1 });

  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const scrollToAuth = () => {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#050816] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" 
          />
        </div>

        <motion.div 
          ref={heroRef}
          className="max-w-5xl mx-auto text-center relative z-10"
          initial="hidden"
          animate={isHeroInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.h1 
            variants={scrollReveal}
            className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            TRACK EVERY TRADE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
              IMPROVE EVERY DECISION.
            </span>
          </motion.h1>

          <motion.p 
            variants={scrollReveal}
            className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12"
          >
            Transform your trading data into a competitive edge. Our AI-powered journal isolates execution flaws and psychological triggers before they become habits.
          </motion.p>

          <motion.div 
            variants={bounceIn}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <motion.button 
              type="button"
              onClick={scrollToAuth}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3"
            >
              Get Started
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            ref={previewRef}
            variants={scrollReveal}
            initial="hidden"
            animate={isPreviewInView ? "visible" : "hidden"}
            className="relative group"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-all duration-700" />
            <div className="relative rounded-[32px] border border-white/10 bg-[#070911]/80 backdrop-blur-3xl p-2 shadow-2xl">
              <div className="rounded-[24px] overflow-hidden border border-white/5 bg-[#0b0f1a]">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="aspect-video w-full relative"
                >
                  {/* App Mockup Screenshot */}
                  <AppImage 
                    src="https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=2070&auto=format&fit=crop" 
                    alt="AI Trade Journal Dashboard Mockup"
                    fill
                    className="opacity-60"
                  />
                  
                  {/* Visual Feature Section Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-transparent flex flex-col justify-end p-6 md:p-12">
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 md:p-8 rounded-[24px] shadow-2xl max-w-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <BrainCircuit size={18} className="text-blue-400" />
                        </div>
                        <h2 className="text-[14px] font-black uppercase tracking-[0.25em] text-blue-400">AI Trade Journal Platform</h2>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Trade tracking', icon: <TrendingUp size={14} /> },
                          { label: 'Performance analytics', icon: <BarChart3 size={14} /> },
                          { label: 'Strategy insights', icon: <BrainCircuit size={14} /> },
                          { label: 'Export reports', icon: <Download size={14} /> },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="text-blue-500">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            ref={featuresHeaderRef}
            className="text-center mb-20"
            initial="hidden"
            animate={isFeaturesHeaderInView ? "visible" : "hidden"}
            variants={scrollReveal}
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">THE ARCHITECTURE OF EDGE</h2>
            <p className="text-slate-500 font-medium uppercase tracking-[0.3em] text-[10px]">Professional tools for disciplined execution</p>
          </motion.div>
          
          <motion.div 
            ref={featuresGridRef}
            variants={staggerContainer}
            initial="hidden"
            animate={isFeaturesGridInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={scrollReveal}
                whileHover={cardHover}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`rounded-[40px] bg-white/[0.02] border transition-all duration-300 cursor-default group relative z-10 overflow-hidden h-[540px] flex flex-col
                  ${hoveredFeature === i ? 'border-blue-500/50 bg-white/[0.05] shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-white/[0.06]'}`}
              >
                {/* Image Section (approx 60% of card height) */}
                <div className="relative h-[60%] w-full overflow-hidden p-4 flex items-center justify-center"> {/* Added padding and flex for centering preview */}
                  {feature.preview} {/* Render the custom built preview */}
                  {/* Dark gradient overlay for bottom-to-top transition and readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent opacity-80" />
                </div>

                {/* Content Section (Bottom 40%) */}
                <div className="relative z-10 p-8 pt-4 flex-1 flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 backdrop-blur-sm shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight text-white">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium group-hover:text-slate-200 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Authentication Section (Moved to flow logically) */}
      <div id="auth-section">
        <AuthScreen />
      </div>

      {/* Professional Legal & Compliance Section */}
      <LegalSection />
    </div>
  );
}