'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  TrendingUp,
  Brain,
  Settings,
  PlusSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Log Trade', href: '/add-trade', icon: PlusSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'AI Coach', href: '/ai-coach', icon: Brain },
  { name: 'Settings', href: '/profile/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border hidden md:flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black">
          T
        </div>
        <span className="font-bold text-lg tracking-tight">TradeJournal</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                isActive
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon
                size={18}
                className={
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
            Account
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30" />
            <div>
              <p className="text-xs font-bold truncate">Trader Pro</p>
              <p className="text-[10px] text-muted-foreground">Free Plan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
