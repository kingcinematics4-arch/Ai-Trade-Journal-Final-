"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrades } from "@/contexts/TradesContext";
import { exportData } from "@/app/exports/exportEngine";
import styles from "./ExportPanel.module.css";
import { Loader2, ListChecks, Filter, Check, Trash2, AlertTriangle, RefreshCcw, X } from "lucide-react";

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
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  const [deletedFilters, setDeletedFilters] = useState<{ id: string; label: string }[]>([]);
  const [showDeletedFilters, setShowDeletedFilters] = useState(false);

  // Debugging log for panel deleted filters as requested
  useEffect(() => {
    console.log("Deleted Filters:", deletedFilters);
  }, [deletedFilters]);

  useEffect(() => {
    const saved = localStorage.getItem('export_fields_panel');
    if (saved) setFields(JSON.parse(saved));

    const savedDeleted = localStorage.getItem('export_deleted_fields_panel');
    if (savedDeleted) {
      try {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed)) {
          // Migrate format
          const normalized = parsed.map(item => typeof item === 'string' ? { id: item, label: formatLabel(item) } : item);
          setDeletedFilters(normalized);
        }
      } catch (e) {
        console.error('Failed to parse deleted fields preferences');
      }
    }
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      const allKeys = new Set<string>();
      trades.slice(0, 10).forEach(item => {
        getFlatKeys(item).forEach(k => allKeys.add(k));
      });
      const optional = Array.from(allKeys)
        .filter(k => !PERMANENT_KEYS.includes(k) && !deletedFilters.some(df => df.id === k))
        .sort();
      setAvailableOptionalFields(optional);
    }
  }, [trades, deletedFilters]);

  const toggleField = (field: string) => {
    const next = fields.includes(field)
      ? fields.filter(f => f !== field)
      : [...fields, field];
    setFields(next);
    localStorage.setItem('export_fields_panel', JSON.stringify(next));
  };

  const handleConfirmDelete = () => {
    if (!filterToDelete) return;
    
    const filterObj = { id: filterToDelete, label: formatLabel(filterToDelete) };
    const nextDeleted = [...deletedFilters, filterObj];
    setDeletedFilters(nextDeleted);
    localStorage.setItem('export_deleted_fields_panel', JSON.stringify(nextDeleted));
    
    if (fields.includes(filterToDelete)) {
      toggleField(filterToDelete);
    }
    setFilterToDelete(null);
  };

  const restoreFilter = (id: string) => {
    console.log("Restoring", id);
    const next = deletedFilters.filter(f => f.id !== id);
    setDeletedFilters(next);
    localStorage.setItem('export_deleted_fields_panel', JSON.stringify(next));
    if (next.length === 0) setShowDeletedFilters(false);
  };

  const restoreAllFilters = () => {
    console.log("Restoring all filters");
    setDeletedFilters([]);
    localStorage.setItem('export_deleted_fields_panel', JSON.stringify([]));
    setShowDeletedFilters(false);
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
                <div className="relative">
                  {deletedFilters.length > 0 && (
                    <button 
                      onClick={() => {
                        console.log("Opening Panel deleted filters popup");
                        setShowDeletedFilters(!showDeletedFilters);
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                        showDeletedFilters ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                      }`}
                    >
                      Edit ({deletedFilters.length})
                    </button>
                  )}

                  {/* POPUP CARD FOR PANEL */}
                  <AnimatePresence>
                    {showDeletedFilters && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-[100] right-0 top-full mt-2 w-72 bg-[#1a1f2e] border border-white/10 shadow-2xl rounded-2xl overflow-hidden p-0"
                      >
                        <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Deleted Filters</h3>
                          <button onClick={() => setShowDeletedFilters(false)} className="text-white/40 hover:text-white">
                            <X size={14} />
                          </button>
                        </div>
                        
                        <div className="max-h-52 overflow-y-auto p-2 custom-scrollbar">
                          {deletedFilters.length === 0 ? (
                            <p className="text-[10px] text-white/30 text-center py-4 italic uppercase tracking-widest">Empty Bin</p>
                          ) : (
                            deletedFilters.map(filter => (
                              <div key={filter.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-1 group">
                                <span className="text-xs font-bold text-white/60 truncate mr-2">{filter.label}</span>
                                <button 
                                  onClick={() => restoreFilter(filter.id)}
                                  className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg hover:bg-primary hover:text-white transition-all shrink-0"
                                >
                                  Restore
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
                          <button 
                            onClick={restoreAllFilters}
                            className="flex-1 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg"
                          >
                            Restore All
                          </button>
                          <button 
                            onClick={() => setShowDeletedFilters(false)}
                            className="flex-1 py-2 bg-white/10 text-white/60 text-[9px] font-black uppercase tracking-widest rounded-lg"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => {
                  setFields([]);
                  localStorage.setItem('export_fields_panel', JSON.stringify([]));
                }} className="text-[10px] font-bold text-primary hover:underline">Clear</button>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-4 max-h-[300px] overflow-y-auto">
              {/* DELETE CONFIRMATION UI */}
              <AnimatePresence>
                {filterToDelete && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-4 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-[10px] font-bold text-red-200">Delete selected filter?</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setFilterToDelete(null)}
                        className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleConfirmDelete}
                        className="px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    <div
                      key={field}
                      className={`group relative flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${
                        fields.includes(field)
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <button
                        onClick={() => toggleField(field)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                          fields.includes(field)
                            ? 'bg-primary border-primary'
                            : 'bg-transparent border-white/20'
                        }`}>
                          {fields.includes(field) && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-[11px] font-medium truncate ${fields.includes(field) ? 'text-primary' : 'text-muted-foreground'}`}>{formatLabel(field)}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFilterToDelete(field); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-300 text-muted-foreground/40 shrink-0"
                        title="Remove from view"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
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