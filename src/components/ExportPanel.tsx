'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrades } from '@/contexts/TradesContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportData } from '@/app/exports/exportEngine';
import styles from './ExportPanel.module.css';
import SearchableSelect from '@/components/ui/SearchableSelect';
import {
  Loader2,
  ListChecks,
  Filter,
  Check,
  Trash2,
  AlertTriangle,
  RefreshCcw,
  X,
  Search,
  Calendar as CalendarIcon,
  Download,
} from 'lucide-react';

const PERMANENT_KEYS = [
  'trade_date',
  'asset_name',
  'risk_amount',
  'pnl_amount',
  'pnl_percent',
  'strategy_used',
];
const ESSENTIAL_KEYS = [
  'trade_direction',
  'entry_price',
  'exit_price',
  'stop_loss',
  'take_profit',
  'lot_size',
  'rr_ratio',
  'notes',
];

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
  updated_at: 'Updated Date',
};

function getFlatKeys(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  let keys: string[] = [];
  Object.keys(obj).forEach((key) => {
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function ExportPanel() {
  const { trades, isLoading } = useTrades();
  const { user, profile } = useAuth();
  const [format, setFormat] = useState('csv');
  const [complianceFormat, setComplianceFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [pdfReportType, setPdfReportType] = useState<'standard' | 'detailed'>('standard');
  const [fileName, setFileName] = useState('export'); // Default filename
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fields, setFields] = useState<string[]>([]); // Default to empty (Full Database Export)
  const [availableOptionalFields, setAvailableOptionalFields] = useState<string[]>([]);
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  const [deletedFilters, setDeletedFilters] = useState<{ id: string; label: string }[]>([]);
  const [showDeletedFilters, setShowDeletedFilters] = useState(false);

  // Debugging log for panel deleted filters as requested
  useEffect(() => {
    console.log('Deleted Filters:', deletedFilters);
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
          const normalized = parsed.map((item) =>
            typeof item === 'string' ? { id: item, label: formatLabel(item) } : item
          );
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
      trades.slice(0, 10).forEach((item) => {
        getFlatKeys(item).forEach((k) => allKeys.add(k));
      });
      const optional = Array.from(allKeys)
        .filter((k) => !PERMANENT_KEYS.includes(k) && !deletedFilters.some((df) => df.id === k))
        .filter((k) => formatLabel(k).toLowerCase().includes(searchTerm.toLowerCase()))
        .sort();
      setAvailableOptionalFields(optional);
    }
  }, [trades, deletedFilters, searchTerm]);

  const toggleField = (field: string) => {
    const next = fields.includes(field) ? fields.filter((f) => f !== field) : [...fields, field];
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
    console.log('Restoring', id);
    const next = deletedFilters.filter((f) => f.id !== id);
    setDeletedFilters(next);
    localStorage.setItem('export_deleted_fields_panel', JSON.stringify(next));
    if (next.length === 0) setShowDeletedFilters(false);
  };

  const restoreAllFilters = () => {
    console.log('Restoring all filters');
    setDeletedFilters([]);
    localStorage.setItem('export_deleted_fields_panel', JSON.stringify([]));
    setShowDeletedFilters(false);
  };

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (!startDate && !endDate) return true;
      const d = new Date(t.trade_date).getTime();
      return (
        (!startDate || d >= new Date(startDate).getTime()) &&
        (!endDate || d <= new Date(endDate).getTime())
      );
    });
  }, [trades, startDate, endDate]);

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
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 lg:grid-cols-[38%_1fr] gap-6 flex-1 overflow-hidden">
              {/* LEFT COLUMN: CONFIGURATION */}
              <div className="flex flex-col gap-5 pr-2">
                <div className="space-y-4">
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Filename</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. trades_q1_report"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Target Format</label>
                    <SearchableSelect
                      items={[
                        { value: 'csv', label: 'CSV (Raw Data)' },
                        { value: 'json', label: 'JSON (API Object)' },
                        { value: 'xlsx', label: 'Excel (Worksheet)' },
                        { value: 'pdf', label: 'PDF (Document)' },
                        { value: 'txt', label: 'TXT (Flat File)' },
                        { value: 'compliance_report', label: 'Annual Compliance Report' },
                      ]}
                      value={format}
                      onSelect={(val) => setFormat(val)}
                      searchable={false}
                      buttonClassName="bg-[#02040a] border border-[#1f2937] rounded-xl px-4 py-3 text-sm text-[#f8fafc] font-inherit transition-all focus:border-blue-500 focus:bg-[#050814] focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  {format === 'compliance_report' && (
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Export Format</label>
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            complianceFormat === 'pdf'
                              ? 'bg-primary text-white'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                          onClick={() => setComplianceFormat('pdf')}
                        >
                          PDF
                        </button>
                        <button
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            complianceFormat === 'xlsx'
                              ? 'bg-primary text-white'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                          onClick={() => setComplianceFormat('xlsx')}
                        >
                          Excel
                        </button>
                      </div>
                    </div>
                  )}

                  {format === 'pdf' && (
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>PDF Report Type</label>
                      <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground hover:text-primary transition-colors">
                          <input
                            type="radio"
                            name="pdfReportType"
                            value="standard"
                            checked={pdfReportType === 'standard'}
                            onChange={() => setPdfReportType('standard')}
                            className="accent-primary"
                          />
                          Standard Summary
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground hover:text-primary transition-colors">
                          <input
                            type="radio"
                            name="pdfReportType"
                            value="detailed"
                            checked={pdfReportType === 'detailed'}
                            onChange={() => setPdfReportType('detailed')}
                            className="accent-primary"
                          />
                          Detailed Log
                        </label>
                      </div>
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Date Range (Optional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        className={styles.input}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <input
                        type="date"
                        className={styles.input}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-4 bg-primary/5 border border-primary/20 rounded-2xl backdrop-blur-sm">
                  <p className="text-[10px] font-black text-primary uppercase mb-1">
                    Export Summary
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Processing <span className="text-white font-bold">{filteredTrades.length}</span>{' '}
                    records with{' '}
                    <span className="text-white font-bold">
                      {fields.length + PERMANENT_KEYS.length}
                    </span>{' '}
                    data points.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: FIELDS */}
              <div className="flex flex-col h-[520px]">
                <div className="flex flex-col h-full bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                  {/* FIELDS HEADER */}
                  <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <label className={styles.fieldLabel}>Select Data Fields</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const essentials = availableOptionalFields.filter((f) =>
                              ESSENTIAL_KEYS.includes(f)
                            );
                            setFields(essentials);
                            localStorage.setItem('export_fields_panel', JSON.stringify(essentials));
                          }}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Essentials
                        </button>
                        <button
                          onClick={() => {
                            setFields(availableOptionalFields);
                            localStorage.setItem(
                              'export_fields_panel',
                              JSON.stringify(availableOptionalFields)
                            );
                          }}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => {
                            setFields([]);
                            localStorage.setItem('export_fields_panel', JSON.stringify([]));
                          }}
                          className="text-[10px] font-bold text-muted-foreground hover:text-white"
                        >
                          Clear
                        </button>
                        <div className="relative">
                          {deletedFilters.length > 0 && (
                            <button
                              onClick={() => setShowDeletedFilters(!showDeletedFilters)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                                showDeletedFilters
                                  ? 'bg-amber-500 text-white shadow-lg'
                                  : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                              }`}
                            >
                              Bin ({deletedFilters.length})
                            </button>
                          )}
                          <AnimatePresence>
                            {showDeletedFilters && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute z-[120] right-0 top-full mt-2 w-64 bg-[#070911] border border-white/10 shadow-2xl rounded-2xl overflow-hidden p-3"
                              >
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                                    Hidden Fields
                                  </span>
                                  <button
                                    onClick={restoreAllFilters}
                                    className="text-[9px] font-bold text-primary"
                                  >
                                    Restore All
                                  </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                  {deletedFilters.map((f) => (
                                    <div
                                      key={f.id}
                                      className="flex justify-between items-center p-2 rounded-lg bg-white/5"
                                    >
                                      <span className="text-[10px] font-bold text-white/60 truncate">
                                        {f.label}
                                      </span>
                                      <button
                                        onClick={() => restoreFilter(f.id)}
                                        className="p-1 hover:text-primary"
                                      >
                                        <RefreshCcw size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* SEARCH BOX */}
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="text"
                        placeholder="Search fields (e.g. price, notes, emotion)..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* FIELDS SCROLL AREA */}
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-black/10">
                    <div className="space-y-6">
                      {/* REQUIRED FIELDS (Always visible) */}
                      <div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <ListChecks size={10} /> Core Mandatory Fields
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {PERMANENT_KEYS.map((key) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 opacity-40"
                            >
                              <Check size={10} className="text-primary" />
                              <span className="text-[11px] font-bold text-white/80">
                                {formatLabel(key)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* OPTIONAL FIELDS GRID */}
                      <div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <Filter size={10} /> Dynamic Optional Fields
                        </p>
                        {availableOptionalFields.length > 0 ? (
                          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                            {availableOptionalFields.map((field) => (
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
                                  <div
                                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                                      fields.includes(field)
                                        ? 'bg-primary border-primary'
                                        : 'bg-transparent border-white/20'
                                    }`}
                                  >
                                    {fields.includes(field) && (
                                      <Check size={10} className="text-white" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[11px] font-bold truncate ${fields.includes(field) ? 'text-primary' : 'text-white/60'}`}
                                  >
                                    {formatLabel(field)}
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterToDelete(field);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-300 text-muted-foreground/40 shrink-0"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                            <p className="text-xs text-muted-foreground italic">
                              No fields matching "{searchTerm}"
                            </p>
                            <button
                              onClick={() => setSearchTerm('')}
                              className="mt-2 text-[10px] font-bold text-primary underline"
                            >
                              Clear Search
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STICKY FOOTER BUTTON */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <button
                className={styles.button}
                onClick={() =>
                  exportData(
                    filteredTrades,
                    {
                      fileName,
                      format,
                      selectedFields: [...PERMANENT_KEYS, ...fields],
                      includeHeaders: true,
                      prettyPrint: true,
                      pdfReportType: format === 'pdf' ? pdfReportType : undefined,
                      complianceFormat:
                        format === 'compliance_report' ? complianceFormat : undefined,
                    } as any,
                    {
                      tasks: [],
                      goals: [],
                      userId: user?.id || '',
                      accountId: user?.id || '',
                    }
                  )
                }
              >
                <Download size={18} className="mr-2" />
                Execute Institutional Export
              </button>
            </div>

            {/* DELETE CONFIRMATION OVERLAY */}
            <AnimatePresence>
              {filterToDelete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-[#070911] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-4 text-red-400">
                      <AlertTriangle size={24} />
                      <h3 className="font-bold">Hide Data Point</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Are you sure you want to remove{' '}
                      <span className="text-white font-bold">"{formatLabel(filterToDelete)}"</span>{' '}
                      from the available export fields list?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFilterToDelete(null)}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-white font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
                      >
                        Confirm Hide
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
