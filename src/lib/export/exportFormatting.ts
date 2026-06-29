import { format } from 'date-fns';

/**
 * Normalizes and applies emojis to emotion strings for professional consistency.
 */
export function formatEmotionWithEmoji(emotion: string): string {
  if (!emotion) return '';
  const e = emotion
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D|[\u2600-\u27BF]/g, '')
    .trim()
    .toUpperCase();

  const map: Record<string, string> = {
    CONFIDENT: '💪 Confident',
    CALM: '😌 Calm',
    FOCUSED: '🎯 Focused',
    FEARFUL: '😨 Fearful',
    ANXIOUS: '😰 Anxious',
    GREEDY: '🤑 Greedy',
    REVENGE: '😡 Revenge',
    EXCITED: '🚀 Excited',
  };

  return map[e] || emotion;
}

/**
 * Formats a numeric value as a currency string.
 */
export function formatCurrency(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

/**
 * Formats a numeric value as a percentage.
 */
export function formatPercentage(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '0.00%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00%';
  return `${num.toFixed(2)}%`;
}

/**
 * Formats a date value into a professional string format.
 */
export function formatExportDate(value: any, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return format(date, formatStr);
  } catch {
    return String(value);
  }
}

/**
 * Calculates standardized analytics from a list of trades.
 */
export function calculateReportAnalytics(trades: any[]) {
  const totalTrades = trades.length;
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let maxWin = -Infinity;
  let maxLoss = Infinity;

  trades.forEach((t) => {
    const pnl = parseFloat(t.pnl_amount || '0');
    if (isNaN(pnl)) return;

    if (pnl > 0) {
      wins++;
      grossProfit += pnl;
      maxWin = Math.max(maxWin, pnl);
    } else if (pnl < 0) {
      losses++;
      grossLoss += Math.abs(pnl);
      maxLoss = Math.min(maxLoss, pnl);
    }
  });

  const netPnl = grossProfit - grossLoss;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgWin = wins > 0 ? grossProfit / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  return {
    totalTrades,
    wins,
    losses,
    winRate,
    grossProfit,
    grossLoss,
    netPnl,
    avgWin,
    avgLoss,
    maxWin: maxWin === -Infinity ? 0 : maxWin,
    maxLoss: maxLoss === Infinity ? 0 : maxLoss,
    profitFactor,
  };
}

/**
 * Recursively flattens an object and applies primitive formatting
 * specifically tailored for raw data exports like CSV.
 */
export function flattenAndFormatTrade(item: any): Record<string, any> {
  const result: Record<string, any> = {};

  function walk(obj: any, prefix = ''): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (typeof value === 'boolean') {
        result[newKey] = value ? 'Yes' : 'No';
      } else if (value instanceof Date) {
        result[newKey] = formatExportDate(value);
      } else if (Array.isArray(value)) {
        result[newKey] = value
          .map((v) => (v && typeof v === 'object' ? JSON.stringify(v) : v))
          .join(', ');
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) {
          result[newKey] = '';
        } else {
          walk(value, newKey);
        }
      } else {
        // Formatting overrides for specific recognizable fields
        if (typeof value === 'string' && newKey.toLowerCase().includes('emotion')) {
          result[newKey] = formatEmotionWithEmoji(value);
        } else if (
          newKey.match(
            /pnl_amount|risk_amount|entry_price|exit_price|fees|commission|gross_pnl|net_pnl/i
          )
        ) {
          // We keep the numeric value as string or number, depending on whether it needs further processing.
          // In raw flatten, we leave numbers alone so Excel/CSV can interpret them,
          // but for CSV text generation we might format them later.
          result[newKey] = value;
        } else if (newKey.match(/date|created_at|updated_at/i)) {
          result[newKey] = formatExportDate(value);
        } else {
          result[newKey] = value;
        }
      }
    });
  }

  walk(item);
  return result;
}

/**
 * Ensures fields are ordered logically.
 */
export function getProfessionalColumnOrder(keys: string[], isTrades: boolean = true): string[] {
  const priorityKeys = isTrades
    ? [
        'trade_date',
        'trade_time',
        'asset_name',
        'pnl_amount',
        'pnl_percent',
        'risk_amount',
        'strategy_used',
        'trade_direction',
        'trade_status',
        'id',
        'symbol',
        'market',
        'exchange',
        'asset_type',
        'side',
        'entry_price',
        'exit_price',
        'stop_loss',
        'take_profit',
        'position_size',
        'quantity',
        'leverage',
        'reward_amount',
        'rr_ratio',
        'fees',
        'commission',
        'spread',
        'slippage',
        'gross_pnl',
        'net_pnl',
        'strategy.name',
        'strategy.category',
        'setup',
        'tags',
        'confidence_level',
        'execution_rating',
        'psychology_rating',
        'emotion_before',
        'emotion_after',
        'mistakes',
        'lessons_learned',
        'goal.title',
        'goal.status',
        'task.title',
        'task.status',
        'notes',
        'session',
        'duration',
        'screenshot_url',
        'created_at',
        'updated_at',
      ]
    : [];

  const remainingKeys = keys.filter((k) => !priorityKeys.includes(k));
  return [...priorityKeys.filter((k) => keys.includes(k)), ...remainingKeys];
}
