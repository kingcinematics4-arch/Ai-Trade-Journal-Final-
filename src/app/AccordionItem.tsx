'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  id: string;
}

export default function AccordionItem({
  title,
  icon,
  children,
  isOpen,
  onToggle,
  id,
}: AccordionItemProps) {
  return (
    <motion.div
      layout
      className={cn(
        'bg-white/[0.02] border border-white/[0.06] rounded-[24px] overflow-hidden transition-all duration-300',
        isOpen
          ? 'shadow-2xl border-blue-500/20 bg-white/[0.04]'
          : 'hover:border-white/[0.1] hover:bg-white/[0.03]'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <ChevronDown className="text-slate-500" size={20} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 pb-8 pt-2 text-sm text-slate-400 leading-relaxed space-y-4 border-t border-white/[0.05]">
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
