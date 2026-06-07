'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { TradeFormData } from './AddTradeForm';
import SearchableSelect from './SearchableSelect';

interface TradeInfoSectionProps {
  form: UseFormReturn<TradeFormData>;
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

export default function TradeInfoSection({ form }: TradeInfoSectionProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { goals } = useGoalsStore();

  const [markets, setMarkets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [durationsList, setDurationsList] = useState<any[]>([]);
  const [hiddenGoalIds, setHiddenGoalIds] = useState<string[]>([]);

  const selectedMarket = watch('marketType');
  const selectedDirection = watch('tradeDirection');
  const selectedDuration = watch('tradeDuration');
  const selectedGoalId = watch('goalId');
  const watchedAssetName = watch('assetName');

  useEffect(() => {
    const m = localStorage.getItem('v2-markets');
    setMarkets(m ? JSON.parse(m) : marketTypes.map(x => ({ id: x, label: x, value: x })));
    
    const a = localStorage.getItem('v2-assets');
    setAssets(a ? JSON.parse(a) : []);

    const d = localStorage.getItem('v2-durations');
    setDurationsList(d ? JSON.parse(d) : durations.map(x => ({ id: x, label: x, value: x })));

    const hg = localStorage.getItem('v2-hidden-goals');
    if (hg) setHiddenGoalIds(JSON.parse(hg));
  }, []);

  const handleAdd = (val: string, setter: any, storageKey: string, setValueKey: keyof TradeFormData, extraProps = {}) => {
    const name = val?.trim();
    if (!name) return;
    const newItem = { id: crypto.randomUUID(), label: name, value: name, ...extraProps };
    setter((prev: any) => {
      if (prev.some((x: any) => x.value === name && (!extraProps || (x as any).market === (extraProps as any).market))) return prev;
      const updated = [newItem, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setValue(setValueKey, name, { shouldDirty: true });
  };

  const handleDelete = (item: any, setter: any, storageKey: string, setValueKey: keyof TradeFormData) => {
    if (!window.confirm(`Remove "${item.label}" from list?`)) return;
    setter((prev: any) => {
      const updated = prev.filter((x) => x.id !== item.id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    if (watch(setValueKey) === item.value || watch(setValueKey) === item.id) {
      setValue(setValueKey, '', { shouldDirty: true });
    }
  };

  const onDeleteGoal = (item: any) => {
    if (!window.confirm(`Hide goal "${item.label}" from this list?`)) return;
    const updated = [...hiddenGoalIds, item.id];
    setHiddenGoalIds(updated);
    localStorage.setItem('v2-hidden-goals', JSON.stringify(updated));
    if (selectedGoalId === item.id) setValue('goalId', '', { shouldDirty: true });
  };

  const assetSuggestions = useMemo(() => {
    const customs = assets.filter((s) => s.market === selectedMarket);
    const defaults = selectedMarket && popularAssets[selectedMarket]
      ? popularAssets[selectedMarket].map(s => ({ id: s, label: s, value: s, market: selectedMarket }))
      : [];
    
    // Filter out items that are logically deleted (if you wanted to support deleting defaults)
    return [...customs, ...defaults].filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
  }, [selectedMarket, assets]);

  const filteredGoals = useMemo(() => {
    return goals
      .filter((g) => g.status !== 'completed' && !hiddenGoalIds.includes(g.id))
      .map((g) => ({ id: g.id, label: g.title, value: g.id }));
  }, [goals, hiddenGoalIds]);

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
        <SearchableSelect
          label="Market Type"
          helperText="Asset class of this trade"
          items={markets}
          value={selectedMarket || ''}
          onSelect={(val) => {
            setValue('marketType', val, { shouldDirty: true, shouldValidate: true });
            setValue('assetName', '', { shouldDirty: true, shouldValidate: true });
          }}
          onDelete={(item) => handleDelete(item, setMarkets, 'v2-markets', 'marketType')}
          onAddCustom={(val) => handleAdd(val, setMarkets, 'v2-markets', 'marketType')}
          error={errors.marketType?.message}
        />

        <SearchableSelect
          label="Asset Symbol"
          helperText={selectedMarket && popularAssets[selectedMarket] ? `Quick: ${popularAssets[selectedMarket].slice(0, 3).join(', ')}...` : 'e.g. BTC/USDT'}
          placeholder="Enter symbol"
          items={assetSuggestions}
          value={watchedAssetName || ''}
          onSelect={(val) => setValue('assetName', val, { shouldDirty: true })}
          onDelete={(item) => handleDelete(item, setAssets, 'v2-assets', 'assetName')}
          onAddCustom={(val) => handleAdd(val, setAssets, 'v2-assets', 'assetName', { market: selectedMarket })}
          error={errors.assetName?.message}
        />
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
                setValue('tradeDirection', dir, { shouldDirty: true, shouldValidate: true });
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
        <SearchableSelect
          label="Trade Duration"
          helperText="How long the trade was held"
          items={durationsList}
          value={selectedDuration || ''}
          onSelect={(val) => setValue('tradeDuration', val, { shouldDirty: true })}
          onDelete={(item) => handleDelete(item, setDurationsList, 'v2-durations', 'tradeDuration')}
          onAddCustom={(val) => handleAdd(val, setDurationsList, 'v2-durations', 'tradeDuration')}
        />
      </div>

      {/* Row 6: Goal Assignment */}
      <SearchableSelect
        label="Assign To Goal"
        helperText="Link this trade's profit to a specific active goal"
        items={[{ id: '', label: 'No Goal', value: '' }, ...filteredGoals]}
        value={selectedGoalId || ''}
        onSelect={(val) => setValue('goalId', val, { shouldDirty: true, shouldValidate: true })}
        onDelete={onDeleteGoal}
      />
    </div>
  );
}
