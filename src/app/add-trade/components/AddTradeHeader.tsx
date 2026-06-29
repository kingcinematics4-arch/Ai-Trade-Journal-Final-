'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export default function AddTradeHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
          aria-label={t('trading.addTrade.aria.backToDashboard')}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-foreground">
            {t('trading.addTrade.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('trading.addTrade.description')}
          </p>
        </div>
      </div>
    </div>
  );
}
