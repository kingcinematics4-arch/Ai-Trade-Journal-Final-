'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Shield, AlertTriangle, Gavel, Receipt, Mail, Lock, Scale } from 'lucide-react';
import Accordion from './Accordion';
import AccordionItem from './AccordionItem';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export default function LegalSection() {
  const { t } = useTranslation();
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
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            {t('legal.title')}
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
            {t('legal.subtitle')}
          </p>
        </motion.div>

        <Accordion>
          <AccordionItem
            id="tos"
            title={t('legal.tos.title')}
            icon={<FileText className="text-blue-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">
              {t('legal.tos.userResponsibilities.title')}
            </h4>
            <p>{t('legal.tos.userResponsibilities.content')}</p>
            <h4 className="text-white font-bold mb-2">{t('legal.tos.acceptableUse.title')}</h4>
            <p>{t('legal.tos.acceptableUse.content')}</p>
            <h4 className="text-white font-bold mb-2">{t('legal.tos.subscription.title')}</h4>
            <p>{t('legal.tos.subscription.content')}</p>
          </AccordionItem>

          <AccordionItem
            id="privacy"
            title={t('legal.privacy.title')}
            icon={<Lock className="text-emerald-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">{t('legal.privacy.dataCollection.title')}</h4>
            <p>{t('legal.privacy.dataCollection.content')}</p>
            <h4 className="text-white font-bold mb-2">{t('legal.privacy.analytics.title')}</h4>
            <p>{t('legal.privacy.analytics.content')}</p>
            <h4 className="text-white font-bold mb-2">{t('legal.privacy.rights.title')}</h4>
            <p>{t('legal.privacy.rights.content')}</p>
          </AccordionItem>

          <AccordionItem
            id="risk"
            title={t('legal.risk.title')}
            icon={<AlertTriangle className="text-rose-400" size={20} />}
          >
            <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl mb-4">
              <p className="text-rose-400 font-bold mb-0">{t('legal.risk.warning')}</p>
              <p className="text-rose-400/80 text-xs">{t('legal.risk.warningContent')}</p>
            </div>
            <h4 className="text-white font-bold mb-2">{t('legal.risk.educational.title')}</h4>
            <p>{t('legal.risk.educational.content')}</p>
            <h4 className="text-white font-bold mb-2">{t('legal.risk.noAdvice.title')}</h4>
            <p>{t('legal.risk.noAdvice.content')}</p>
          </AccordionItem>

          <AccordionItem
            id="disclaimer"
            title={t('legal.disclaimer.title')}
            icon={<Scale className="text-purple-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">
              {t('legal.disclaimer.toolLimitation.title')}
            </h4>
            <p>{t('legal.disclaimer.toolLimitation.content')}</p>
            <h4 className="text-white font-bold mb-2">{t('legal.disclaimer.accuracy.title')}</h4>
            <p>{t('legal.disclaimer.accuracy.content')}</p>
          </AccordionItem>

          <AccordionItem
            id="refund"
            title={t('legal.refund.title')}
            icon={<Receipt className="text-amber-400" size={20} />}
          >
            <h4 className="text-white font-bold mb-2">{t('legal.refund.cancellation.title')}</h4>
            <p>{t('legal.refund.cancellation.content')}</p>
            <h4 className="text-white font-bold mb-2">{t('legal.refund.exceptions.title')}</h4>
            <p>{t('legal.refund.exceptions.content')}</p>
          </AccordionItem>

          <AccordionItem
            id="contact"
            title={t('legal.contact.title')}
            icon={<Mail className="text-indigo-400" size={20} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-bold mb-2">{t('legal.contact.support.title')}</h4>
                <p className="text-xs">{t('legal.contact.support.email')}</p>
                <p className="text-xs">{t('legal.contact.support.responseTime')}</p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-2">{t('legal.contact.business.title')}</h4>
                <p className="text-xs text-slate-500">{t('legal.contact.business.company')}</p>
                <p className="text-xs text-slate-500">{t('legal.contact.business.location')}</p>
              </div>
            </div>
          </AccordionItem>
        </Accordion>

        {/* Footer Links (Internal Navigation) */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 border-t border-white/[0.05] pt-8">
          <button
            onClick={() => document.getElementById('tos')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            {t('legal.footer.tos')}
          </button>
          <button
            onClick={() =>
              document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            {t('legal.footer.privacy')}
          </button>
          <button
            onClick={() => document.getElementById('risk')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            {t('legal.footer.risk')}
          </button>
          <button
            onClick={() =>
              document.getElementById('disclaimer')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            {t('legal.footer.disclaimer')}
          </button>
        </div>
      </div>
    </section>
  );
}
