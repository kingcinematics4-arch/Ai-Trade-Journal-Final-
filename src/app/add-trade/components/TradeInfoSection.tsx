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

  const [customStocks, setCustomStocks] = useState<any[]>([]);
  const [customGoals, setCustomGoals] = useState<any[]>([]);
  const [customMarkets, setCustomMarkets] = useState<any[]>([]);
  const [customDurations, setCustomDurations] = useState<any[]>([]);

  const selectedMarket = watch('marketType');
  const selectedDirection = watch('tradeDirection');
  const selectedDuration = watch('tradeDuration');
  const selectedGoalId = watch('goalId');
  const watchedAssetName = watch('assetName');

  useEffect(() => {
    const m = localStorage.getItem('custom-markets');
    if (m) setCustomMarkets(JSON.parse(m));
    const s = localStorage.getItem('custom-stocks');
    if (s) setCustomStocks(JSON.parse(s));
    const g = localStorage.getItem('custom-goals');
    if (g) setCustomGoals(JSON.parse(g));
    const d = localStorage.getItem('custom-durations');
    if (d) setCustomDurations(JSON.parse(d));
  }, []);

  const onDeleteStock = (item: any) => {
    setCustomStocks((prev) => {
      const updated = prev.filter((x) => x.id !== item.id);
      localStorage.setItem('custom-stocks', JSON.stringify(updated));
      return updated;
    });

    if (watchedAssetName === (item.value || item.id)) {
      setValue('assetName', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  const onDeleteGoal = (item: any) => {
    setCustomGoals((prev) => {
      const updated = prev.filter((x) => x.id !== item.id);
      localStorage.setItem('custom-goals', JSON.stringify(updated));
      return updated;
    });

    if (selectedGoalId === item.id) {
      setValue('goalId', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  const onDeleteMarket = (item: any) => {
    setCustomMarkets((prev) => {
      const updated = prev.filter((x) => x.id !== item.id);
      localStorage.setItem('custom-markets', JSON.stringify(updated));
      return updated;
    });

    if (selectedMarket === (item.value || item.id)) {
      setValue('marketType', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleAddCustomMarket = (val: string) => {
    const name = val?.trim();
    if (!name) return;

    const newItem = {
      id: crypto.randomUUID(),
      label: name,
      value: name,
      isCustom: true,
    };

    setCustomMarkets((prev) => {
      if (prev.some((m) => m.value === name)) return prev;
      const updated = [newItem, ...prev];
      localStorage.setItem('custom-markets', JSON.stringify(updated));
      return updated;
    });

    setValue('marketType', name, { shouldDirty: true, shouldValidate: true });
  };

  const onDeleteDuration = (item: any) => {
    setCustomDurations((prev) => {
      const updated = prev.filter((x) => x.id !== item.id);
      localStorage.setItem('custom-durations', JSON.stringify(updated));
      return updated;
    });

    if (selectedDuration === (item.value || item.id)) {
      setValue('tradeDuration', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleAddCustomDuration = (val: string) => {
    const name = val?.trim();
    if (!name) return;

    const newItem = {
      id: crypto.randomUUID(),
      label: name,
      value: name,
      isCustom: true,
    };

    setCustomDurations((prev) => {
      if (prev.some((d) => d.value === name)) return prev;
      const updated = [newItem, ...prev];
      localStorage.setItem('custom-durations', JSON.stringify(updated));
      return updated;
    });

    setValue('tradeDuration', name, { shouldDirty: true, shouldValidate: true });
  };

  const handleAddCustomStock = (val: string) => {
    const name = val?.trim();
    if (!name) return;

    const newItem = {
      id: crypto.randomUUID(),
      label: name,
      value: name,
      market: selectedMarket,
      isCustom: true,
    };

    setCustomStocks((prev) => {
      if (prev.some((s) => s.value === name && s.market === selectedMarket)) return prev;
      const updated = [newItem, ...prev];
      localStorage.setItem('custom-stocks', JSON.stringify(updated));
      return updated;
    });

    setValue('assetName', name, { shouldDirty: true, shouldValidate: true });
  };

  const assetSuggestions = useMemo(() => {
    const customs = customStocks
      .filter((s) => s.market === selectedMarket)
      .map((s) => ({ ...s, name: s.label || s.name || s.symbol, isCustom: true }));

    const defaults =
      selectedMarket && popularAssets[selectedMarket]
        ? popularAssets[selectedMarket]
            .filter((s) => !customs.some((c) => (c.value || c.name) === s))
            .map((s) => ({ id: s, label: s, value: s, isCustom: false }))
        : [];

    return [...customs, ...defaults];
  }, [selectedMarket, customStocks]);

  const marketOptions = useMemo(() => {
    const defaults = marketTypes.map(m => ({ id: m, label: m, value: m, isCustom: false }));
    const customs = customMarkets.map(m => ({ ...m, isCustom: true }));
    return [...customs, ...defaults];
  }, [customMarkets]);

  const durationOptions = useMemo(() => {
    const defaults = durations.map(d => ({ id: d, label: d, value: d, isCustom: false }));
    const customs = customDurations.map(d => ({ ...d, isCustom: true }));
    return [...customs, ...defaults];
  }, [customDurations]);

  const filteredGoals = useMemo(() => {
    const activeGoals = goals
      .filter((g) => g.status !== 'completed')
      .map((g) => ({
        id: g.id, // Database UUID
        name: g.title,
        isCustom: false,
      }));
    const customs = customGoals.map(g => ({ ...g, isCustom: true })); // Ensure isCustom is set
    return [...customs, ...activeGoals];
  }, [goals, customGoals]);

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
          items={marketOptions}
          value={selectedMarket || ''}
          onSelect={(val) => {
            setValue('marketType', val, { shouldDirty: true, shouldValidate: true });
            setValue('assetName', '', { shouldDirty: true, shouldValidate: true });
          }}
          onDelete={onDeleteMarket}
          onAddCustom={handleAddCustomMarket}
          error={errors.marketType?.message}
        />

        <SearchableSelect
          label="Asset Name / Symbol"
          helperText={selectedMarket && popularAssets[selectedMarket] ? `Quick: ${popularAssets[selectedMarket].slice(0, 3).join(', ')}...` : 'e.g. BTC/USDT'}
          placeholder="Enter symbol"
          items={assetSuggestions}
          value={watchedAssetName || ''}
          onSelect={(val) => setValue('assetName', val, { shouldDirty: true, shouldValidate: true })}
          onDelete={onDeleteStock}
          onAddCustom={handleAddCustomStock}
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
          items={durationOptions}
          value={selectedDuration || ''}
          onSelect={(val) => setValue('tradeDuration', val, { shouldDirty: true, shouldValidate: true })}
          onDelete={onDeleteDuration}
          onAddCustom={handleAddCustomDuration}
        />
      </div>

      {/* Row 6: Goal Assignment */}
      <SearchableSelect
        label="Assign To Goal"
        helperText="Link this trade's profit to a specific active goal"
        items={[{ id: '', name: 'No Goal' }, ...filteredGoals]}
        value={selectedGoalId || ''}
        onSelect={(val) => setValue('goalId', val, { shouldDirty: true, shouldValidate: true })}
        onDelete={onDeleteGoal}
      />
    </div>
  );
}
