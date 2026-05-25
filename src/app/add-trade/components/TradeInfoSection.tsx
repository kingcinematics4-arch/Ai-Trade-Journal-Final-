'use client';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './AddTradeForm';

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
  const selectedMarket = watch('marketType');
  const selectedDirection = watch('tradeDirection');

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
        <div>
          <label className="form-label" htmlFor="market-type">
            Market Type
          </label>
          <p className="form-helper">Asset class of this trade</p>
          <select
            id="market-type"
            className="form-input mt-1.5"
            {...register('marketType', { required: 'Market type is required' })}
          >
            <option value="">Select market</option>
            {marketTypes.map((m) => (
              <option key={`mkt-${m}`} value={m}>
                {m}
              </option>
            ))}
          </select>
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
        <div>
          <label className="form-label" htmlFor="trade-duration">
            Trade Duration
          </label>
          <p className="form-helper">How long the trade was held</p>
          <select id="trade-duration" className="form-input mt-1.5" {...register('tradeDuration')}>
            <option value="">Select duration</option>
            {durations.map((d) => (
              <option key={`dur-${d}`} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
