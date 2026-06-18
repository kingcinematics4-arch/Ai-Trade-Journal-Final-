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
  Scale
} from 'lucide-react';
import Accordion from './Accordion';
import AccordionItem from './AccordionItem';

export default function LegalSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="legal" className="py-24 px-6 relative z-10">
      <div className="max-w-4xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">LEGAL & COMPLIANCE</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Institutional Governance Framework</p>
        </motion.div>

        <Accordion>
          <AccordionItem 
            id="tos" 
            title="Terms of Service" 
            icon={<FileText className="text-blue-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">1. User Responsibilities</h4>
            <p>Users are responsible for maintaining the confidentiality of their credentials and for all activities conducted through their account. You must provide accurate information during registration.</p>
            <h4 className="text-white font-bold mb-2">2. Acceptable Use</h4>
            <p>The platform is for personal trading analysis. Reverse engineering, automated data scraping, or using the service to provide unauthorized financial advice is strictly prohibited.</p>
            <h4 className="text-white font-bold mb-2">3. Subscription & Billing</h4>
            <p>Access to premium features requires a valid subscription. Fees are non-refundable unless specified in the Refund Policy. We reserve the right to modify pricing with 30 days notice.</p>
          </AccordionItem>

          <AccordionItem 
            id="privacy" 
            title="Privacy Policy" 
            icon={<Lock className="text-emerald-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">Data Collection</h4>
            <p>We collect trade data, authentication details, and platform usage metrics to provide AI insights. Your trade data is encrypted at rest and in transit.</p>
            <h4 className="text-white font-bold mb-2">Analytics & Cookies</h4>
            <p>We use essential cookies for session management and anonymized analytics to improve performance. We do not sell user data to third-party advertisers.</p>
            <h4 className="text-white font-bold mb-2">Your Rights</h4>
            <p>You have the right to export your data (via the Export Engine) or request permanent account deletion at any time through the settings panel.</p>
          </AccordionItem>

          <AccordionItem 
            id="risk" 
            title="Risk Disclosure" 
            icon={<AlertTriangle className="text-rose-400" size={20} />}
          >
            <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl mb-4">
              <p className="text-rose-400 font-bold mb-0">High Risk Warning:</p>
              <p className="text-rose-400/80 text-xs">Trading financial instruments involves significant risk of loss. You should only trade with capital you can afford to lose.</p>
            </div>
            <h4 className="text-white font-bold mb-2">Educational Purposes</h4>
            <p>AITradeJournal provides analytics and journaling tools for educational use. We do not guarantee profitability, and past performance is not indicative of future results.</p>
            <h4 className="text-white font-bold mb-2">No Financial Advice</h4>
            <p>Our AI Coach and analytics metrics are based on mathematical models of your data. They do not constitute financial, investment, or legal advice.</p>
          </AccordionItem>

          <AccordionItem 
            id="disclaimer" 
            title="Disclaimer" 
            icon={<Scale className="text-purple-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">Tool Limitation</h4>
            <p>This platform is a journaling and data analysis tool. It is NOT a trading platform, broker, or exchange. We do not execute trades or hold user funds.</p>
            <h4 className="text-white font-bold mb-2">Accuracy of Data</h4>
            <p>While we strive for 100% accuracy, users should verify critical calculations. We are not liable for losses resulting from data entry errors or system latency.</p>
          </AccordionItem>

          <AccordionItem 
            id="refund" 
            title="Refund Policy" 
            icon={<Receipt className="text-amber-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">Cancellation</h4>
            <p>You may cancel your subscription at any time. You will retain access until the end of the current billing cycle. No partial refunds are issued for unused time.</p>
            <h4 className="text-white font-bold mb-2">Exceptions</h4>
            <p>Refunds may be granted within 7 days of the initial purchase if the service is technically non-functional and our support team cannot resolve the issue.</p>
          </AccordionItem>

          <AccordionItem 
            id="contact" 
            title="Contact & Legal Info" 
            icon={<Mail className="text-indigo-400" size={20} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-bold mb-2">Support</h4>
                <p className="text-xs">Email: support@aitradejournal.com</p>
                <p className="text-xs">Response time: &lt; 24 hours (Mon-Fri)</p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-2">Business Info</h4>
                <p className="text-xs text-slate-500">AITrade Intelligence Systems LLC</p>
                <p className="text-xs text-slate-500">Registered in Delaware, USA</p>
              </div>
            </div>
          </AccordionItem>
        </Accordion>

        {/* Footer Links (Internal Navigation) */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 border-t border-white/[0.05] pt-8">
          <button onClick={() => document.getElementById('tos')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Terms</button>
          <button onClick={() => document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Privacy</button>
          <button onClick={() => document.getElementById('risk')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Risk</button>
          <button onClick={() => document.getElementById('disclaimer')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Disclaimer</button>
        </div>
      </div>
    </section>
  );
}