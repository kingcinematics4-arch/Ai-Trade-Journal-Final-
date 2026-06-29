'use client';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { TradeFormData } from './AddTradeForm';
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceSectionProps {
  form: UseFormReturn<TradeFormData>;
}

export default function PerformanceSection({ form }: PerformanceSectionProps) {
  const { t } = useTranslation();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const pnlValue = watch('pnlAmount');
  const rrValue = watch('rrRatio');
  const pnl = pnlValue ? parseFloat(pnlValue) : 0;
  const rr = rrValue ? parseFloat(rrValue) : 0;
  const tradeStatus = watch('tradeStatus');

  return (
    <div className="space-y-5">
      {/* Auto-calc notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Calculator size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300">{t('trading.addTrade.performance.autoCalcNotice')}</p>
      </div>

      {/* P&L + RR Display */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-lg border ${
            pnl > 0
              ? 'bg-green-500/10 border-green-500/20'
              : pnl < 0
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-muted border-border'
          }`}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t('trading.addTrade.performance.pnlAmount')}
          </p>
          <p
            className={`text-2xl font-bold font-tabular ${
              pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-muted-foreground'
            }`}
          >
            {pnl > 0 ? '+$' : pnl < 0 ? '-$' : '$'}
            {isFinite(pnl) ? Math.abs(pnl).toFixed(2) : '0.00'}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            rr >= 2
              ? 'bg-green-500/10 border-green-500/20'
              : rr >= 1
                ? 'bg-amber-500/10 border-amber-500/20'
                : rr > 0
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-muted border-border'
          }`}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t('trading.addTrade.performance.rrRatio')}
          </p>
          <p
            className={`text-2xl font-bold font-tabular ${
              rr >= 2
                ? 'text-green-400'
                : rr >= 1
                  ? 'text-amber-400'
                  : rr > 0
                    ? 'text-red-400'
                    : 'text-muted-foreground'
            }`}
          >
            {isFinite(rr) && rr > 0 ? `${rr.toFixed(2)}R` : '—'}
          </p>
        </div>
      </div>

      {/* Manual Override Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label" htmlFor="pnl-amount">
            {t('trading.addTrade.performance.pnlAmountLabel')}
          </label>
          <p className="form-helper">{t('trading.addTrade.performance.pnlHelper')}</p>
          <input
            id="pnl-amount"
            type="number"
            step="any"
            className="form-input mt-1.5"
            placeholder={t('trading.addTrade.performance.autoCalculated')}
            {...register('pnlAmount', {
              validate: (v: string) =>
                v === '' ||
                !isNaN(parseFloat(v)) ||
                t('trading.addTrade.performance.pnlMustBeNumber'),
            })}
          />
          {errors.pnlAmount && <p className="form-error">{errors.pnlAmount.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="rr-ratio">
            {t('trading.addTrade.performance.rrRatioLabel')}
          </label>
          <p className="form-helper">{t('trading.addTrade.performance.rrHelper')}</p>
          <input
            id="rr-ratio"
            type="number"
            step="0.01"
            className="form-input mt-1.5"
            placeholder={t('trading.addTrade.performance.autoCalculated')}
            {...register('rrRatio', {
              validate: (v: string) =>
                v === '' ||
                parseFloat(v) >= 0 ||
                t('trading.addTrade.performance.rrMustBePositive'),
            })}
          />
          {errors.rrRatio && <p className="form-error">{errors.rrRatio.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="trade-status">
            {t('trading.addTrade.performance.tradeOutcome')}
          </label>
          <p className="form-helper">{t('trading.addTrade.performance.outcomeHelper')}</p>
          <div className="flex gap-2 mt-1.5">
            {(['win', 'loss', 'breakeven'] as const).map((s) => (
              <button
                key={`status-${s}`}
                type="button"
                onClick={() =>
                  setValue('tradeStatus', s, { shouldDirty: true, shouldValidate: true })
                }
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all duration-150 motion-safe:hover:-translate-y-0.5 active:scale-95 ${
                  tradeStatus === s
                    ? s === 'win'
                      ? 'bg-green-500/15 border-green-500/40 text-green-400'
                      : s === 'loss'
                        ? 'bg-red-500/15 border-red-500/40 text-red-400'
                        : 'bg-zinc-500/15 border-zinc-500/40 text-zinc-400'
                    : 'border-border text-muted-foreground hover:border-zinc-600 hover:text-foreground'
                }`}
              >
                {s === 'win' ? (
                  <>
                    <TrendingUp size={12} /> {t('trading.addTrade.performance.win')}
                  </>
                ) : s === 'loss' ? (
                  <>
                    <TrendingDown size={12} /> {t('trading.addTrade.performance.loss')}
                  </>
                ) : (
                  <>
                    <Minus size={12} /> {t('trading.addTrade.performance.breakeven')}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
