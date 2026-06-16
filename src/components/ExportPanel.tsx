"use client";

import { useState, useEffect } from "react";
import { useTrades } from "@/contexts/TradesContext";
import { exportData } from "@/app/exports/exportEngine";
import styles from "./ExportPanel.module.css";
import { Loader2, ListChecks, Filter, Check } from "lucide-react";

const PERMANENT_KEYS = ['trade_date', 'asset_name', 'risk_amount', 'pnl_amount', 'pnl_percent', 'strategy_used'];
const ESSENTIAL_KEYS = ['trade_direction', 'entry_price', 'exit_price', 'stop_loss', 'take_profit', 'lot_size', 'rr_ratio', 'notes'];

const FIELD_LABELS: Record<string, string> = {
  trade_date: 'Date',
  asset_name: 'Asset Name',
  risk_amount: 'Amount',
  pnl_amount: 'PNL',
  pnl_percent: 'PNL %',
  strategy_used: 'Strategy',
  trade_direction: 'Direction',
  entry_price: 'Entry Price',
  exit_price: 'Exit Price',
  stop_loss: 'Stop Loss',
  take_profit: 'Take Profit',
  lot_size: 'Quantity',
  rr_ratio: 'Risk Reward Ratio',
  notes: 'Notes',
  created_at: 'Created Date',
  updated_at: 'Updated Date'
};

function getFlatKeys(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  let keys: string[] = [];
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      keys = [...keys, ...getFlatKeys(value, newKey)];
    } else {
      keys.push(newKey);
    }
  });
  return keys;
}

const formatLabel = (key: string) => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/[._]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function ExportPanel() {
  const { trades, isLoading } = useTrades();
  const [format, setFormat] = useState("csv");
  const [fileName, setFileName] = useState("export"); // Default filename
  const [fields, setFields] = useState<string[]>([]); // Default to empty (Full Database Export)
  const [availableOptionalFields, setAvailableOptionalFields] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('export_fields_panel');
    if (saved) setFields(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      const allKeys = new Set<string>();
      trades.slice(0, 10).forEach(item => {
        getFlatKeys(item).forEach(k => allKeys.add(k));
      });
      const optional = Array.from(allKeys).filter(k => !PERMANENT_KEYS.includes(k)).sort();
      setAvailableOptionalFields(optional);
    }
  }, [trades]);

  const toggleField = (field: string) => {
    const next = fields.includes(field)
      ? fields.filter(f => f !== field)
      : [...fields, field];
    setFields(next);
    localStorage.setItem('export_fields_panel', JSON.stringify(next));
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Export Engine</h2>
          <p className={styles.subtitle}>Configure institutional-grade data reports</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : trades.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.checkboxText}>No data available for export</p>
          </div>
        ) : (
        <div className={styles.formSection}>
          {/* FILE NAME */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Filename</label>
            <input
              className={styles.input}
              placeholder="e.g. trades_q1_report"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          {/* FORMAT SELECT */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Target Format</label>
            <select 
              className={styles.select}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="csv">CSV (Raw Data)</option>
              <option value="json">JSON (API Object)</option>
              <option value="xlsx">Excel (Worksheet)</option>
              <option value="pdf">PDF (Document)</option>
              <option value="txt">TXT (Flat File)</option>
              <option value="zip">ZIP (Archive All)</option>
            </select>
          </div>

          {/* FIELD FILTERS */}
          <div className={styles.inputGroup}>
            <div className="flex items-center justify-between mb-4">
              <label className={styles.fieldLabel}>Export Fields</label>
              <div className="flex gap-3">
                <button onClick={() => {
                  const essentials = availableOptionalFields.filter(f => ESSENTIAL_KEYS.includes(f));
                  setFields(essentials);
                  localStorage.setItem('export_fields_panel', JSON.stringify(essentials));
                }} className="text-[10px] font-bold text-primary hover:underline">Essentials</button>
                <button onClick={() => {
                  setFields(availableOptionalFields);
                  localStorage.setItem('export_fields_panel', JSON.stringify(availableOptionalFields));
                }} className="text-[10px] font-bold text-primary hover:underline">Select All</button>
                <button onClick={() => {
                  setFields([]);
                  localStorage.setItem('export_fields_panel', JSON.stringify([]));
                }} className="text-[10px] font-bold text-primary hover:underline">Clear</button>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-4 max-h-[300px] overflow-y-auto">
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase flex items-center gap-1.5">
                  <ListChecks size={10} /> Required Fields
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PERMANENT_KEYS.map(key => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 opacity-50">
                      <Check size={12} className="text-primary" />
                      <span className="text-[11px] text-muted-foreground">{formatLabel(key)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase flex items-center gap-1.5">
                  <Filter size={10} /> Optional Fields
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableOptionalFields.map(field => (
                    <label key={field} className="flex items-center gap-2 p-2 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={fields.includes(field)}
                        onChange={() => toggleField(field)}
                        className="w-3.5 h-3.5 rounded-sm bg-black border-white/10 checked:bg-primary"
                      />
                      <span className={`text-[11px] truncate ${fields.includes(field) ? 'text-primary' : 'text-muted-foreground'}`}>
                        {formatLabel(field)}
                      </span>
                    </label>
                  ))}
                </div>
                {availableOptionalFields.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic py-2">No optional fields detected</p>
                )}
              </div>
            </div>
          </div>

          <button
            className={styles.button}
            onClick={() =>
              exportData(trades, {
                fileName,
                format,
                selectedFields: [...PERMANENT_KEYS, ...fields],
                includeHeaders: true,
                prettyPrint: true
              } as any)
            }
          >
            Execute Export
          </button>
        </div>
        )}
      </div>
    </div>
  );
}