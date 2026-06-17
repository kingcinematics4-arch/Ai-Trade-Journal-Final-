'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart3, BrainCircuit, Download, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Trade Tracking System',
    description: 'Log every detail of your trades with precision, from entry/exit points to market conditions and personal notes.',
    icon: <LayoutDashboard size={24} className="text-blue-400" />,
  },
  {
    title: 'Performance Analytics Dashboard',
    description: 'Visualize your trading performance with advanced metrics like P&L, R-multiple, win rate, and drawdown analysis.',
    icon: <BarChart3 size={24} className="text-emerald-400" />,
  },
  {
    title: 'Strategy Insights',
    description: 'Evaluate the effectiveness of your trading strategies with AI-driven insights, identifying strengths and weaknesses.',
    icon: <BrainCircuit size={24} className="text-purple-400" />,
  },
  {
    title: 'Export/Report System',
    description: 'Generate professional, customizable reports for tax purposes, performance reviews, or sharing with mentors.',
    icon: <Download size={24} className="text-amber-400" />,
  },
];

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white selection:bg-blue-500/30 overflow-x-hidden pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
              App Showcase
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Explore the powerful features that make AI Trade Journal your ultimate trading companion.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all relative overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                  {feature.icon}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{feature.title}</h2>
              </div>
              <p className="text-zinc-400 text-base leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} className="text-center mt-20">
          <Link href="/#auth-section" className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all">
            <TrendingUp size={20} /> Start Your Journey
          </Link>
        </motion.div>
      </div>
    </div>
  );
}