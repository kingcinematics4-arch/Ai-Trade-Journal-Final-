'use client';
import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { TradeFormData } from './AddTradeForm';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradeInfoSectionProps {
  form: UseFormReturn<TradeFormData>;
  onPriceChange: () => void;
}

const marketTypes = ['Crypto', 'Forex', 'Stocks', 'Futures', 'Options', 'Commodities', 'Indices'];

const popularAssets: Record<string, string[]> = {
  Crypto: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT'],
  Forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD'],
  Stocks: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL'],
  Futures: ['NQ Futures', 'ES Futures', 'CL Futures', 'GC Futures', 'ZB Futures'],
  Options: ['SPY Calls', 'QQQ Puts', 'AAPL Calls', 'TSLA Puts'],
  Commodities: ['Gold', 'Silver', 'Crude Oil', 'Natural Gas', 'Wheat'],
  Indices: ['S&P 500', 'NASDAQ 100', 'Dow Jones', 'DAX 40', 'FTSE 100'],
};

const durations = [
  '< 5 min',
  '5–15 min',
  '15–30 min',
  '30–60 min',
  '1–2h',
  '2–4h',
  '4–8h',
  '8–24h',
  '1–3 days',
  '3+ days',
];

export default function TradeInfoSection({ form, onPriceChange }: TradeInfoSectionProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { goals } = useGoalsStore();
  const selectedMarket = watch('marketType');
  const selectedDirection = watch('tradeDirection');
  const selectedDuration = watch('tradeDuration');
  const selectedGoalId = watch('goalId');

  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);

  const marketRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (marketRef.current && !marketRef.current.contains(event.target as Node)) {
        setIsMarketOpen(false);
      }
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setIsDurationOpen(false);
      }
      if (goalRef.current && !goalRef.current.contains(event.target as Node)) {
        setIsGoalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-5">
      {/* Row 1: Title + Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="trade-title">
            Trade Title
          </label>
          <p className="form-helper">Optional label for quick identification</p>
          <input
            id="trade-title"
            type="text"
            className="form-input mt-1.5"
            placeholder="e.g. BTC Breakout Long — May 8"
            {...register('tradeTitle')}
          />
        </div>
        <div>
          <label className="form-label" htmlFor="trade-date">
            Trade Date
          </label>
          <p className="form-helper">Date the trade was executed</p>
          <input
            id="trade-date"
            type="date"
            className="form-input mt-1.5"
            {...register('tradeDate', { required: 'Trade date is required' })}
          />
          {errors.tradeDate && <p className="form-error">{errors.tradeDate.message}</p>}
        </div>
      </div>

      {/* Row 2: Market + Asset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative" ref={marketRef}>
          <label className="form-label">Market Type</label>
          <p className="form-helper">Asset class of this trade</p>
          
          <button
            type="button"
            onClick={() => setIsMarketOpen(!isMarketOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all ${
              isMarketOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50' : ''
            }`}
          >
            <span className={selectedMarket ? 'text-white' : 'text-zinc-500'}>
              {selectedMarket || 'Select market'}
            </span>
            <ChevronDown 
              size={14} 
              className={`text-zinc-500 transition-transform duration-300 ${isMarketOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          <AnimatePresence>
            {isMarketOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {marketTypes.map((m) => (
                    <button
                      key={`mkt-${m}`}
                      type="button"
                      onClick={() => {
                        setValue('marketType', m, { shouldDirty: true, shouldValidate: true });
                        setIsMarketOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedMarket === m 
                          ? 'bg-zinc-800 text-white' 
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('marketType', { required: 'Market type is required' })} />
          {errors.marketType && <p className="form-error">{errors.marketType.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="asset-name">
            Asset Name / Symbol
          </label>
          <p className="form-helper">
            {selectedMarket && popularAssets[selectedMarket]
              ? `Quick: ${popularAssets[selectedMarket].slice(0, 3).join(', ')}...`
              : 'e.g. BTC/USDT, EUR/USD, AAPL'}
          </p>
          <input
            id="asset-name"
            type="text"
            className="form-input mt-1.5"
            placeholder={
              selectedMarket && popularAssets[selectedMarket]
                ? popularAssets[selectedMarket][0]
                : 'Enter symbol'
            }
            list="asset-suggestions"
            {...register('assetName', { required: 'Asset name is required' })}
          />
          {selectedMarket && popularAssets[selectedMarket] && (
            <datalist id="asset-suggestions">
              {popularAssets[selectedMarket].map((a) => (
                <option key={`asset-opt-${a}`} value={a} />
              ))}
            </datalist>
          )}
          {errors.assetName && <p className="form-error">{errors.assetName.message}</p>}
        </div>
      </div>

      {/* Row 3: Direction */}
      <div>
        <label className="form-label">Trade Direction</label>
        <p className="form-helper">Whether you went long (buy) or short (sell)</p>
        <div className="flex gap-3 mt-1.5">
          {(['buy', 'sell'] as const).map((dir) => (
            <button
              key={`dir-${dir}`}
              type="button"
              onClick={() => {
                setValue('tradeDirection', dir);
                onPriceChange();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                selectedDirection === dir
                  ? dir === 'buy'
                    ? 'bg-green-500/15 border-green-500/40 text-green-400'
                    : 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'border-border text-muted-foreground hover:border-zinc-600 hover:text-foreground'
              }`}
            >
              {dir === 'buy' ? '▲ Long (Buy)' : '▼ Short (Sell)'}
            </button>
          ))}
        </div>
        {errors.tradeDirection && (
          <p className="form-error mt-1">{errors.tradeDirection.message}</p>
        )}
      </div>

      {/* Row 4: Prices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="form-label" htmlFor="entry-price">
            Entry Price
          </label>
          <input
            id="entry-price"
            type="number"
            step="any"
            className="form-input"
            placeholder="0.00"
            {...register('entryPrice', {
              required: 'Entry price is required',
              min: { value: 0.000001, message: 'Must be positive' },
            })}
            onBlur={onPriceChange}
          />
          {errors.entryPrice && <p className="form-error">{errors.entryPrice.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="exit-price">
            Exit Price
          </label>
          <input
            id="exit-price"
            type="number"
            step="any"
            className="form-input"
            placeholder="0.00"
            {...register('exitPrice', {
              required: 'Exit price is required',
              min: { value: 0.000001, message: 'Must be positive' },
            })}
            onBlur={onPriceChange}
          />
          {errors.exitPrice && <p className="form-error">{errors.exitPrice.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="stop-loss">
            Stop Loss
          </label>
          <input
            id="stop-loss"
            type="number"
            step="any"
            className="form-input"
            placeholder="0.00"
            {...register('stopLoss', { required: 'Stop loss is required' })}
            onBlur={onPriceChange}
          />
          {errors.stopLoss && <p className="form-error">{errors.stopLoss.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="take-profit">
            Take Profit
          </label>
          <input
            id="take-profit"
            type="number"
            step="any"
            className="form-input"
            placeholder="0.00"
            {...register('takeProfit')}
            onBlur={onPriceChange}
          />
        </div>
      </div>

      {/* Row 5: Lot Size + Risk + Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label" htmlFor="lot-size">
            Lot Size / Quantity
          </label>
          <p className="form-helper">Number of units, contracts, or shares</p>
          <input
            id="lot-size"
            type="number"
            step="any"
            className="form-input mt-1.5"
            placeholder="1"
            {...register('lotSize', {
              required: 'Lot size is required',
              min: { value: 0.01, message: 'Must be at least 0.01' },
            })}
            onBlur={onPriceChange}
          />
          {errors.lotSize && <p className="form-error">{errors.lotSize.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="risk-amount">
            Risk Amount ($)
          </label>
          <p className="form-helper">Dollar amount risked on this trade</p>
          <input
            id="risk-amount"
            type="number"
            step="any"
            className="form-input mt-1.5"
            placeholder="100.00"
            {...register('riskAmount', {
              required: 'Risk amount is required',
              min: { value: 0.01, message: 'Must be positive' },
            })}
          />
          {errors.riskAmount && <p className="form-error">{errors.riskAmount.message}</p>}
        </div>
        <div className="relative" ref={durationRef}>
          <label className="form-label">Trade Duration</label>
          <p className="form-helper">How long the trade was held</p>
          
          <button
            type="button"
            onClick={() => setIsDurationOpen(!isDurationOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all ${
              isDurationOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50' : ''
            }`}
          >
            <span className={selectedDuration ? 'text-white' : 'text-zinc-500'}>
              {selectedDuration || 'Select duration'}
            </span>
            <ChevronDown 
              size={14} 
              className={`text-zinc-500 transition-transform duration-300 ${isDurationOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          <AnimatePresence>
            {isDurationOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {durations.map((d) => (
                    <button
                      key={`dur-${d}`}
                      type="button"
                      onClick={() => {
                        setValue('tradeDuration', d, { shouldDirty: true });
                        setIsDurationOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedDuration === d 
                          ? 'bg-zinc-800 text-white' 
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('tradeDuration')} />
        </div>
      </div>

      {/* Row 6: Goal Assignment */}
      <div className="space-y-2 relative" ref={goalRef}>
        <label className="text-sm font-medium text-zinc-300">Assign To Goal</label>
        <p className="form-helper">Link this trade's profit to a specific active goal</p>
        
        <button
          type="button"
          onClick={() => setIsGoalOpen(!isGoalOpen)}
          className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all ${
            isGoalOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50' : ''
          }`}
        >
          <span className={selectedGoalId ? 'text-white' : 'text-zinc-500'}>
            {goals.find(g => g.id === selectedGoalId)?.title || 'No Goal'}
          </span>
          <ChevronDown 
            size={14} 
            className={`text-zinc-500 transition-transform duration-300 ${isGoalOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        <AnimatePresence>
          {isGoalOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setValue('goalId', '', { shouldDirty: true });
                    setIsGoalOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    !selectedGoalId 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  No Goal
                </button>
                {goals
                  .filter((goal) => goal.status !== 'completed')
                  .map((goal) => (
                    <button
                      key={`goal-${goal.id}`}
                      type="button"
                      onClick={() => {
                        setValue('goalId', goal.id, { shouldDirty: true });
                        setIsGoalOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedGoalId === goal.id 
                          ? 'bg-zinc-800 text-white' 
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {goal.title}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <input type="hidden" {...register('goalId')} />
      </div>
    </div>
  );
}
