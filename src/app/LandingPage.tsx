'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  BookOpen, 
  BrainCircuit, 
  Target, 
  BarChart3, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  TrendingUp,
  Activity,
  Users,
  CheckCircle2
} from 'lucide-react';

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
  hidden: { opacity: 0, scale: 0.95, y: 20 },
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
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
  {
    title: "Trade Logging",
    description: "Intuitive interface designed for institutional speed. Record entries, exits, and context in seconds.",
    icon: <BookOpen className="text-blue-400" />,
  },
  {
    title: "AI Analysis",
    description: "Identify hidden patterns. Our neural engine detects emotional triggers and execution flaws automatically.",
    icon: <BrainCircuit className="text-emerald-400" />,
  },
  {
    title: "Strategy Tracking",
    description: "Compare performance across different setups. Isolate your true edge with granular data tagging.",
    icon: <Target className="text-indigo-400" />,
  },
  {
    title: "Advanced Analytics",
    description: "Visual summaries of Expectancy, Profit Factor, and Drawdown. Professional metrics, simplified.",
    icon: <BarChart3 className="text-purple-400" />,
  },
  {
    title: "Risk Management",
    description: "Monitor R-multiple and portfolio heat. Ensure survival with institutional-grade risk oversight.",
    icon: <ShieldCheck className="text-rose-400" />,
  },
  {
    title: "Institutional Export",
    description: "Generate professional PDF or XLSX reports for performance reviews or tax compliance.",
    icon: <Download className="text-amber-400" />,
  }
];

const stats = [
  { label: "Trades Tracked", value: "2.4M+", icon: <Activity size={16} /> },
  { label: "Avg. Edge Growth", value: "18.5%", icon: <TrendingUp size={16} /> },
  { label: "Active Traders", value: "12k+", icon: <Users size={16} /> },
  { label: "Success Rate", value: "99.9%", icon: <CheckCircle2 size={16} /> },
];

export default function LandingPage() {
  // Scroll-reactive refs
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: false, amount: 0.2 });

  const previewRef = useRef(null);
  const isPreviewInView = useInView(previewRef, { once: false, amount: 0.2 });

  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: false, amount: 0.2 });

  const featuresHeaderRef = useRef(null);
  const isFeaturesHeaderInView = useInView(featuresHeaderRef, { once: false, amount: 0.5 });

  const featuresGridRef = useRef(null);
  const isFeaturesGridInView = useInView(featuresGridRef, { once: false, amount: 0.1 });

  const ctaRef = useRef(null);
  const isCtaInView = useInView(ctaRef, { once: false, amount: 0.2 });

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
        <div className="absolute inset-0 z-0">
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
                <div className="aspect-video w-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center p-12">
               <div className="w-full h-full flex flex-col justify-center text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-blue-400">AI Trade Journal Platform</h2>
                  </div>
                  <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-6 max-w-xl">
                    AI-powered system to track trades, analyze performance, and improve trading decisions using structured data.
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
                    {[
                      'Trade history tracking',
                      'Performance analytics (win/loss, accuracy)',
                      'Strategy evaluation',
                      'Exportable reports',
                      'Clean dashboard insights',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">
                    Built for disciplined traders who rely on data, not emotion.
                  </p>
               </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <motion.div 
          ref={statsRef}
          className="max-w-7xl mx-auto px-6"
          initial="hidden"
          animate={isStatsInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                variants={scrollReveal}
                className="flex flex-col items-center lg:items-start"
              >
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  {stat.icon}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                </div>
                <span className="text-4xl md:text-5xl font-black tracking-tighter">{stat.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
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
                className="p-10 rounded-[40px] bg-white/[0.02] border border-white/[0.06] transition-colors duration-300 hover:bg-white/[0.04] cursor-default group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium group-hover:text-slate-400 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <motion.div 
          ref={ctaRef}
          initial="hidden"
          animate={isCtaInView ? "visible" : "hidden"}
          variants={scrollReveal}
          whileHover={{ scale: 1.02 }}
          className="max-w-5xl mx-auto rounded-[60px] bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-950 p-12 md:p-24 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <motion.h2 
              variants={scrollReveal}
              className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]"
            >
              READY TO MASTER <br /> YOUR PERFORMANCE?
            </motion.h2>
            <motion.p 
              variants={scrollReveal}
              className="text-white/70 text-lg md:text-xl font-medium max-w-xl mx-auto mb-12 leading-relaxed"
            >
              Join 12,000+ traders using AI to eliminate emotional bias and achieve consistent profitability.
            </motion.p>
            <motion.button 
              onClick={scrollToAuth}
              variants={bounceIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all shadow-xl"
            >
              Initialize Account
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}