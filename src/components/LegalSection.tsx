'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FileText,
  Shield,
  AlertTriangle,
  Gavel,
  Receipt,
  Mail,
  Lock,
  Scale,
  ShieldCheck,
  Fingerprint,
  Database,
  Activity,
  Cookie,
} from 'lucide-react';
import Accordion from '@/app/Accordion';
import AccordionItem from '@/app/AccordionItem';

export default function LegalSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const trustBadges = [
    { icon: <ShieldCheck size={18} />, label: 'Encrypted Data Storage' },
    { icon: <Fingerprint size={18} />, label: 'Privacy Focused' },
    { icon: <Database size={18} />, label: 'Secure Multi-Tenancy' },
    { icon: <Activity size={18} />, label: 'Real-time Analytics' },
  ];

  return (
    <section
      id="legal"
      className="py-32 px-6 relative z-10 border-t border-white/[0.03] bg-[#03050e]"
    >
      <div className="max-w-5xl mx-auto" ref={ref}>
        {/* Institutional Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 text-white leading-none">
            LEGAL & COMPLIANCE
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mb-12">
            Institutional Governance Framework
          </p>

          {/* Trust Elements */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-50 hover:opacity-100 transition-opacity duration-500">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="text-blue-500">{badge.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <Accordion>
          <AccordionItem
            id="tos"
            title="Terms of Service"
            icon={<FileText className="text-blue-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-3">1. Software License</h4>
            <p>
              AITradeJournal grants you a non-exclusive, non-transferable license to use the
              analytics platform for personal or professional trade journaling. Reverse engineering,
              automated data scraping, or unauthorized redistribution of our AI-derived insights is
              strictly prohibited.
            </p>
            <h4 className="text-white font-bold mt-6 mb-3">2. Subscription & Termination</h4>
            <p>
              Access to premium terminal features is provided on a recurring cyclical basis. You may
              terminate your agreement at any time; however, AITradeJournal retains the right to
              suspend accounts engaged in malicious infrastructure interference or compliance
              violations.
            </p>
          </AccordionItem>

          <AccordionItem
            id="privacy"
            title="Privacy Policy"
            icon={<Lock className="text-emerald-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-3">Data Custody</h4>
            <p>
              We implement a "privacy-by-design" architecture. Your trade data and execution
              metadata are encrypted at rest using AES-256 standards. We utilize anonymized data
              aggregates to improve our specialized pattern recognition models, ensuring your
              specific strategies remain proprietary.
            </p>
            <h4 className="text-white font-bold mt-6 mb-3">Sub-Processors</h4>
            <p>
              AITradeJournal partners with Tier-1 infrastructure providers (Supabase, OpenAI,
              Vercel) to ensure global availability and security. All data processing is performed
              under strict DPA (Data Processing Agreement) protocols.
            </p>
          </AccordionItem>

          <AccordionItem
            id="risk"
            title="Risk Disclosure"
            icon={<AlertTriangle className="text-rose-400" size={20} />}
          >
            <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl mb-6">
              <p className="text-rose-400 font-bold mb-2 uppercase tracking-tighter">
                High Risk Investment Warning:
              </p>
              <p className="text-rose-400/80 text-xs leading-relaxed">
                Trading financial instruments, including equities, forex, and digital assets,
                involves significant risk of capital loss. Leverage can magnify both profits and
                losses. Ensure you understand the risks before utilizing our performance tracking
                tools.
              </p>
            </div>
            <h4 className="text-white font-bold mb-3">Past Performance</h4>
            <p>
              AITradeJournal provides historical analysis. Neither the AI Coach nor the performance
              dashboards guarantee future profitability. Market conditions are dynamic, and past win
              rates are not indicative of future execution success.
            </p>
          </AccordionItem>

          <AccordionItem
            id="disclaimer"
            title="Trading Disclaimer"
            icon={<Scale className="text-purple-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-3">Not a Broker-Dealer</h4>
            <p>
              AITradeJournal is a journaling and analytics engine. We do NOT execute trades, custody
              funds, or act as an exchange. All execution occurs through your independent brokerage
              firm.
            </p>
            <h4 className="text-white font-bold mt-6 mb-3">No Financial Advice</h4>
            <p>
              Our platform provides mathematical analysis and behavioral insights. Nothing on this
              platform constitutes a recommendation to buy or sell securities. Users retain 100%
              accountability for their capital deployment decisions.
            </p>
          </AccordionItem>

          <AccordionItem
            id="security"
            title="Data Security & Cookie Policy"
            icon={<Shield className="text-blue-500" size={20} />}
          >
            <h4 className="text-white font-bold mb-3">Security Standards</h4>
            <p>
              We utilize TLS 1.3 for all data in transit. Our infrastructure is monitored 24/7 for
              intrusion detection. Multi-factor authentication (MFA) is recommended for all
              professional-tier accounts.
            </p>
            <h4 className="text-white font-bold mt-6 mb-3">Cookie Usage</h4>
            <p>
              We use essential cookies strictly for session authentication and JWT persistence. We
              do not deploy third-party advertising trackers or sell your behavioral data to
              marketing agencies.
            </p>
          </AccordionItem>

          <AccordionItem
            id="contact"
            title="Contact & Compliance"
            icon={<Mail className="text-indigo-400" size={20} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-white font-bold mb-3">Institutional Support</h4>
                <p className="text-xs text-slate-400">
                  For legal inquiries or corporate compliance audits, please transmit formal
                  correspondence to:
                </p>
                <p className="text-sm font-bold text-white mt-4 tracking-tight">
                  compliance@aitradejournal.com
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-3">Corporate Entity</h4>
                <p className="text-xs text-slate-500 font-medium">
                  AITrade Intelligence Systems Corp.
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">Venture-backed Tech Hub</p>
                <p className="text-[10px] text-slate-600 mt-4 uppercase tracking-widest font-black">
                  Registered Regulatory ID: #8829-01-SEC
                </p>
              </div>
            </div>
          </AccordionItem>
        </Accordion>

        {/* Footer Navigation Links */}
        <div className="mt-20 flex flex-wrap justify-center gap-10 border-t border-white/[0.05] pt-12">
          {['tos', 'privacy', 'risk', 'disclaimer'].map((id) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.3em]"
            >
              {id === 'tos' ? 'Terms' : id}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
