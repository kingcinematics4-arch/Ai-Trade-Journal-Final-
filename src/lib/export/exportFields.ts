import { format, isValid, parseISO } from 'date-fns';

/** Human-readable labels for known export field keys */
export const EXPORT_FIELD_LABELS: Record<string, string> = {
  trade_date: 'Date',
  trade_time: 'Entry Time',
  exit_time: 'Exit Time',
  asset_name: 'Asset',
  symbol: 'Symbol',
  market_type: 'Market',
  market: 'Market',
  exchange: 'Exchange',
  asset_type: 'Asset Type',
  risk_amount: 'Amount',
  pnl_amount: 'P&L',
  pnl_percent: 'P&L %',
  gross_pnl: 'Gross P&L',
  net_pnl: 'Net P&L',
  strategy_used: 'Strategy',
  'strategy.name': 'Strategy',
  'strategy.category': 'Strategy Category',
  setup: 'Setup',
  trade_direction: 'Trade Type',
  side: 'Side',
  trade_status: 'Win/Loss',
  entry_price: 'Entry Price',
  exit_price: 'Exit Price',
  stop_loss: 'Stop Loss',
  take_profit: 'Take Profit',
  lot_size: 'Quantity',
  position_size: 'Position Size',
  quantity: 'Quantity',
  leverage: 'Leverage',
  rr_ratio: 'Risk Reward',
  reward_amount: 'Reward',
  fees: 'Fees',
  commission: 'Commission',
  spread: 'Spread',
  slippage: 'Slippage',
  notes: 'Notes',
  tags: 'Tags',
  duration: 'Duration',
  trade_duration: 'Duration',
  session: 'Account',
  account: 'Account',
  confidence_level: 'Confidence',
  execution_rating: 'Execution Rating',
  psychology_rating: 'Psychology Rating',
  emotion_before: 'Emotion Before',
  emotion_after: 'Emotion After',
  mistakes: 'Mistakes',
  mistake_category: 'Mistake Category',
  lessons_learned: 'Lessons Learned',
  screenshot_url: 'Screenshot',
  created_at: 'Created Date',
  updated_at: 'Updated Date',
  id: 'ID',
  title: 'Title',
  name: 'Name',
  date: 'Date',
  value: 'Value',
  status: 'Status',
};

/** Locked required trade fields in export UI */
export const TRADE_PERMANENT_KEYS = [
  'trade_date',
  'asset_name',
  'risk_amount',
  'pnl_amount',
  'pnl_percent',
  'strategy_used',
] as const;

/** Quick-select optional trade fields */
export const TRADE_ESSENTIAL_KEYS = [
  'trade_direction',
  'entry_price',
  'exit_price',
  'stop_loss',
  'take_profit',
  'lot_size',
  'rr_ratio',
  'notes',
] as const;

/**
 * Column order aligned with Excel export priority keys.
 * Fields present in data/selection are rendered in this order first.
 */
export const TRADE_COLUMN_PRIORITY: string[] = [
  'trade_date',
  'trade_time',
  'exit_time',
  'asset_name',
  'symbol',
  'market_type',
  'market',
  'exchange',
  'asset_type',
  'trade_direction',
  'side',
  'trade_status',
  'entry_price',
  'exit_price',
  'stop_loss',
  'take_profit',
  'lot_size',
  'position_size',
  'quantity',
  'leverage',
  'risk_amount',
  'pnl_amount',
  'pnl_percent',
  'gross_pnl',
  'net_pnl',
  'rr_ratio',
  'reward_amount',
  'fees',
  'commission',
  'spread',
  'slippage',
  'strategy_used',
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
  'mistake_category',
  'lessons_learned',
  'notes',
  'session',
  'account',
  'duration',
  'trade_duration',
  'screenshot_url',
  'created_at',
  'updated_at',
  'id',
];

const LONG_TEXT_FIELDS = new Set([
  'notes',
  'lessons_learned',
  'mistakes',
  'strategy_used',
  'setup',
  'tags',
  'screenshot_url',
]);

const NUMERIC_FIELDS = new Set([
  'pnl_amount',
  'pnl_percent',
  'risk_amount',
  'entry_price',
  'exit_price',
  'stop_loss',
  'take_profit',
  'lot_size',
  'position_size',
  'quantity',
  'rr_ratio',
  'fees',
  'commission',
  'gross_pnl',
  'net_pnl',
  'reward_amount',
  'leverage',
  'spread',
  'slippage',
  'value',
  'profit',
]);

const PNL_FIELDS = new Set([
  'pnl_amount',
  'pnl_percent',
  'gross_pnl',
  'net_pnl',
  'profit',
  'value',
]);

const DATE_FIELDS = new Set([
  'trade_date',
  'date',
  'created_at',
  'updated_at',
]);

export function getExportFieldLabel(key: string): string {
  if (EXPORT_FIELD_LABELS[key]) return EXPORT_FIELD_LABELS[key];
  return key
    .replace(/[._]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function orderExportKeys(keys: string[]): string[] {
  const unique = Array.from(new Set(keys));
  const prioritized = TRADE_COLUMN_PRIORITY.filter((k) => unique.includes(k));
  const remaining = unique.filter((k) => !TRADE_COLUMN_PRIORITY.includes(k)).sort();
  return [...prioritized, ...remaining];
}

/**
 * Resolves export columns from selected fields (Export Filters) or data keys.
 * PDF and CSV use the same order as Excel.
 */
export function resolveExportColumns(data: Record<string, unknown>[], selectedFields?: string[]): string[] {
  if (!data.length) return [];

  const dataKeys = new Set(data.flatMap((row) => Object.keys(row ?? {})));

  if (selectedFields?.length) {
    return orderExportKeys(selectedFields);
  }

  return orderExportKeys(Array.from(dataKeys));
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && isValid(value)) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
    return isValid(parsed) ? parsed : null;
  }
  return null;
}

export function formatExportCellValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  if (Array.isArray(value)) {
    return value
      .map((item) => (item && typeof item === 'object' ? JSON.stringify(item) : String(item)))
      .join(', ');
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '—';
    }
  }

  if (DATE_FIELDS.has(field) || field.endsWith('_at') || field.endsWith('_date')) {
    const parsed = parseDateValue(value);
    if (parsed) return format(parsed, field.includes('time') ? 'dd MMM yyyy HH:mm' : 'dd MMM yyyy');
  }

  if (NUMERIC_FIELDS.has(field) && !Number.isNaN(Number(value))) {
    const num = Number(value);
    if (PNL_FIELDS.has(field)) {
      const sign = num > 0 ? '+' : '';
      return `${sign}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  return String(value);
}

export function isLongTextField(field: string): boolean {
  return LONG_TEXT_FIELDS.has(field) || field.includes('notes') || field.includes('lesson');
}

export function isPnlField(field: string): boolean {
  return PNL_FIELDS.has(field);
}

/** Fixed columns for standard PDF report (compact investor summary) */
export const STANDARD_PDF_COLUMNS = [
  { key: 'trade_date', label: 'Date' },
  { key: 'asset_name', label: 'Asset' },
  { key: 'strategy_used', label: 'Strategy' },
  { key: 'risk_amount', label: 'Amount' },
  { key: 'pnl_amount', label: 'P&L' },
  { key: 'trade_status', label: 'Result' },
] as const;

export type PdfReportType = 'standard' | 'detailed';

function resolveNestedValue(row: Record<string, unknown>, key: string): unknown {
  if (key in row) return row[key];
  if (key.includes('.')) {
    const parts = key.split('.');
    let current: unknown = row;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
  return undefined;
}

/** Resolves a standard-report cell with sensible fallbacks across trade shapes */
export function getStandardPdfCellValue(field: string, row: Record<string, unknown>): string {
  switch (field) {
    case 'trade_date': {
      const parsed = parseDateValue(row.trade_date ?? row.date ?? row.created_at);
      return parsed ? format(parsed, 'dd-MMM') : '—';
    }
    case 'asset_name':
      return formatExportCellValue('asset_name', row.asset_name ?? row.symbol ?? row.asset);
    case 'strategy_used':
      return formatExportCellValue(
        'strategy_used',
        row.strategy_used ?? resolveNestedValue(row, 'strategy.name'),
      );
    case 'risk_amount':
      return formatExportCellValue('risk_amount', row.risk_amount ?? row.amount);
    case 'pnl_amount':
      return formatExportCellValue('pnl_amount', row.pnl_amount ?? row.net_pnl ?? row.pnl ?? row.profit);
    case 'trade_status': {
      const status = row.trade_status ?? row.status;
      if (status !== null && status !== undefined && status !== '') {
        return formatExportCellValue('trade_status', status);
      }
      const pnl = Number(row.pnl_amount ?? row.net_pnl ?? row.pnl ?? row.profit ?? 0);
      if (pnl > 0) return 'Win';
      if (pnl < 0) return 'Loss';
      return 'Breakeven';
    }
    default:
      return formatExportCellValue(field, resolveNestedValue(row, field));
  }
}

export function getFlatKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  let keys: string[] = [];
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      keys = [...keys, ...getFlatKeys(value as Record<string, unknown>, newKey)];
    } else {
      keys.push(newKey);
    }
  });
  return keys;
}
