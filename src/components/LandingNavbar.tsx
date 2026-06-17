'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features', type: 'scroll' },
    { name: 'Showcase', href: '#showcase', type: 'scroll' },
  ];

  const scrollToAuth = () => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
  
  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      if (id === 'showcase') {
        window.dispatchEvent(new CustomEvent('trigger-showcase-highlight'));
      }
    }
  };

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-[90] transition-all duration-500 px-6 sm:px-10 py-5",
        isScrolled ? "bg-[#050816]/80 backdrop-blur-xl border-b border-white/[0.05] py-4" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="transition-transform duration-500 group-hover:rotate-[360deg]">
            <AppLogo size={32} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-white">AITrade</span>
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none">SaaS Intelligence</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <button 
              key={link.name} 
              type="button"
              onClick={() => {
                if (link.type === 'scroll') {
                  scrollToId(link.href.replace('#', ''));
                } else {
                  router.push(link.href);
                }
              }}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
            >
              {link.name}
            </button>
          ))}
        </div>

        {/* Auth CTAs */}
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={scrollToAuth}
            className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-white hover:text-blue-400 transition-colors"
          >
            Sign In
          </button>
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </nav>
  );
}