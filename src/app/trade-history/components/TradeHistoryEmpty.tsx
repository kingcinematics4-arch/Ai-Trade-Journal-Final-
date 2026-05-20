'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, PlusCircle } from 'lucide-react';

export default function TradeHistoryEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="card-elevated flex flex-col items-center justify-center text-center py-20 px-6"
    >
      <motion.div
        initial={{ y: 10 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
      >
        <BookOpen size={36} className="text-primary" />
      </motion.div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No trades added yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        Start building your trading journal by logging your first trade. Track your performance,
        analyze patterns, and improve your strategy over time.
      </p>
      <Link
        href="/add-trade"
        className="btn-primary flex items-center gap-2 py-2.5 px-6 text-sm"
      >
        <PlusCircle size={16} />
        Log Your First Trade
      </Link>
    </motion.div>
  );
}
