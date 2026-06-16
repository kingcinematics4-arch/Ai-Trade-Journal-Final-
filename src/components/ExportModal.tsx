'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Check, Settings2, Loader2, Table, Filter, ListChecks, Trash2, AlertTriangle, RefreshCcw, Eraser } from 'lucide-react';
import { exportData } from '@/app/exports/exportEngine';
import { logExport, ExportFormat } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';

const TRADE_PERMANENT_KEYS = ['trade_date', 'asset_name', 'risk_amount', 'pnl_amount', 'pnl_percent', 'strategy_used'];
const TRADE_ESSENTIAL_KEYS = ['trade_direction', 'entry_price', 'exit_price', 'stop_loss', 'take_profit', 'lot_size', 'rr_ratio', 'notes'];

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

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  // Data is expected to be an array of objects
  data: any[];
  onExportSuccess?: () => void;
}

const FORMATS: { value: ExportFormat; label: string; icon: string }[] = [
  { value: 'xlsx', label: 'Excel (.xlsx)', icon: '📊' },
  { value: 'pdf', label: 'Document (.pdf)', icon: '📄' },
  { value: 'csv', label: 'Data (.csv)', icon: '📝' },
  { value: 'json', label: 'Raw (.json)', icon: '💽' },
  { value: 'md', label: 'Markdown (.md)', icon: '✍️' },
  { value: 'zip', label: 'Archive (.zip)', icon: '📦' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, ease: [0.2, 0.8, 0.2, 1] }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0.8, 0.2, 1] } }
};

const getPreviewColumns = (category: string, data: any[]) => {
  if (data.length === 0) return [];
  const firstItem = data[0];

  switch (category) {
    case 'trades':
      return [
        { key: 'asset_name', label: 'Name' },
        { key: 'trade_date', label: 'Date' },
        { key: 'pnl_amount', label: 'Profit' },
      ];
    case 'goals':
      return [
        { key: 'title', label: 'Name' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Profit' },
      ];
    case 'calendar': // events
      return [
        { key: 'title', label: 'Name' },
        { key: 'date', label: 'Date' },
        { key: 'startTime', label: 'Profit' },
      ];
    case 'analytics':
      return [
        { key: 'name', label: 'Name' },
        { key: 'date', label: 'Date' },
        { key: 'value', label: 'Profit' },
      ];
    default:
      const keys = Object.keys(firstItem);
      return [
        { key: keys[0] || 'name', label: 'Name' },
        { key: keys[1] || 'date', label: 'Date' },
        { key: keys[2] || 'value', label: 'Profit' },
      ];
  }
};

export default function ExportModal({ isOpen, onClose, category, data, onExportSuccess }: ExportModalProps) {
  const [filename, setFilename] = useState(`${category}_export`);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<'single' | 'separate'>('single');
  const [selectedOptionalFields, setSelectedOptionalFields] = useState<string[]>([]);
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  const [deletedFilters, setDeletedFilters] = useState<{ id: string; label: string }[]>([]);
  const [showDeletedFilters, setShowDeletedFilters] = useState(false);
  const [availableOptionalFields, setAvailableOptionalFields] = useState<string[]>([]);
  const [includeMeta, setIncludeMeta] = useState(true);

  // Debugging log for deleted filters state as requested
  useEffect(() => {
    console.log("Deleted Filters:", deletedFilters);
  }, [deletedFilters]);

  // Load saved preferences
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(`export_fields_${category}`);
      if (saved) {
        try {
          setSelectedOptionalFields(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse export preferences');
        }
      }
    }
  }, [isOpen, category]);

  // Load deleted fields from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedDeleted = localStorage.getItem(`export_deleted_fields_${category}`);
      if (savedDeleted) {
        try {
          const parsed = JSON.parse(savedDeleted);
          if (Array.isArray(parsed)) {
            // Migrate strings to objects if necessary
            const normalized = parsed.map(item => typeof item === 'string' ? { id: item, label: formatLabel(item) } : item);
            setDeletedFilters(normalized);
          }
        } catch (e) {
          console.error('Failed to parse deleted fields preferences');
        }
      }
    }
  }, [isOpen, category]);

  // Detect available fields
  useEffect(() => {
    if (isOpen && data && data.length > 0) {
      const permanent = category === 'trades' ? TRADE_PERMANENT_KEYS : [];
      const allKeys = new Set<string>();
      data.slice(0, 10).forEach(item => {
        getFlatKeys(item).forEach(k => allKeys.add(k));
      });
      const optional = Array.from(allKeys)
        .filter(k => !permanent.includes(k) && !deletedFilters.some(df => df.id === k))
        .sort();
      setAvailableOptionalFields(optional);
    }
  }, [isOpen, data, category, deletedFilters]);

  const toggleField = (field: string) => {
    const next = selectedOptionalFields.includes(field)
      ? selectedOptionalFields.filter(f => f !== field)
      : [...selectedOptionalFields, field];
    setSelectedOptionalFields(next);
    localStorage.setItem(`export_fields_${category}`, JSON.stringify(next));
  };

  const handleConfirmDelete = () => {
    if (!filterToDelete) return;
    
    const filterObj = { id: filterToDelete, label: formatLabel(filterToDelete) };
    const nextDeleted = [...deletedFilters, filterObj];
    setDeletedFilters(nextDeleted);
    localStorage.setItem(`export_deleted_fields_${category}`, JSON.stringify(nextDeleted));
    
    // Also remove from selected if it was there
    if (selectedOptionalFields.includes(filterToDelete)) {
      const nextSelected = selectedOptionalFields.filter(f => f !== filterToDelete);
      setSelectedOptionalFields(nextSelected);
      localStorage.setItem(`export_fields_${category}`, JSON.stringify(nextSelected));
    }
    
    setFilterToDelete(null);
    toast.success(`Filter "${filterObj.label}" removed from view`);
  };

  const restoreFilter = (id: string) => {
    console.log("Restoring", id);
    const filterToRestore = deletedFilters.find(f => f.id === id);
    const next = deletedFilters.filter(f => f.id !== id);
    setDeletedFilters(next);
    localStorage.setItem(`export_deleted_fields_${category}`, JSON.stringify(next));
    
    if (filterToRestore) {
      toast.success(`Restored "${filterToRestore.label}"`);
    }
    if (next.length === 0) setShowDeletedFilters(false);
  };

  const restoreAllFilters = () => {
    console.log("Restoring all filters");
    setDeletedFilters([]);
    localStorage.setItem(`export_deleted_fields_${category}`, JSON.stringify([]));
    setShowDeletedFilters(false);
    toast.success('All filters restored');
  };

  if (!isOpen) return null;

  const quickActions = {
    selectAll: () => {
      setSelectedOptionalFields(availableOptionalFields);
      localStorage.setItem(`export_fields_${category}`, JSON.stringify(availableOptionalFields));
    },
    clear: () => {
      setSelectedOptionalFields([]);
      localStorage.setItem(`export_fields_${category}`, JSON.stringify([]));
    },
    tradingEssentials: () => {
      const essentials = availableOptionalFields.filter(f => TRADE_ESSENTIAL_KEYS.includes(f));
      setSelectedOptionalFields(essentials);
      localStorage.setItem(`export_fields_${category}`, JSON.stringify(essentials));
    }
  };

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    const loadingToast = toast.loading('Architecting professional report...');
    
    const permanent = category === 'trades' ? TRADE_PERMANENT_KEYS : [];

    try {
      // Execute the export via the specialized export engine
      const success = await exportData(data, {
        fileName: filename,
        format: format as any,
      // Ensure we pass the actual field names to the engine
        selectedFields: (category === 'trades' || selectedOptionalFields.length > 0)
          ? [...permanent, ...selectedOptionalFields]
          : undefined,
        includeHeaders: true,
        prettyPrint: true,
        exportMode: exportMode
      }, {
        // Note: For a truly global report, consider passing actual store data here
        tasks: [],
        goals: []
      });
      
      if (!success && format === 'xlsx') {
        throw new Error('Excel generation engine failed');
      }

      logExport(category, format);
      toast.success(`Professional ${format.toUpperCase()} exported successfully!`, { id: loadingToast });
      onExportSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`, { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <Settings2 size={18} className="text-primary" />
            <h3 className="font-bold text-lg text-foreground">Export Configuration</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-all duration-200 text-muted-foreground hover:scale-110 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Filename</label>
            <input 
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Output Format</label>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {FORMATS.map((f) => (
                <motion.button
                  key={f.value}
                  variants={itemVariants}
                  onClick={() => setFormat(f.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all duration-300 ${
                    format === f.value 
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <span className="text-base">{f.icon}</span>
                  {f.label.split(' ')[0]}
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* DATA FIELDS FILTER SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Export Fields</label>
              <div className="flex gap-2 relative">
                <button onClick={quickActions.tradingEssentials} className="text-[9px] font-bold text-primary hover:underline transition-all">Essentials</button>
                <button onClick={quickActions.selectAll} className="text-[9px] font-bold text-primary hover:underline transition-all">All</button>
                
                {deletedFilters.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      console.log("Opening deleted filters popup");
                      setShowDeletedFilters(!showDeletedFilters);
                    }}
                    className={`text-[9px] font-black flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                      showDeletedFilters 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                        : 'text-amber-500 hover:text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}
                  >
                    Edit Filters ({deletedFilters.length})
                  </button>
                )}

                {/* NEW REBUILT POPUP CARD */}
                <AnimatePresence>
                  {showDeletedFilters && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute z-[60] right-0 top-full mt-3 w-80 bg-[#070911]/98 backdrop-blur-2xl border border-white/[0.1] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[24px] overflow-hidden p-0"
                    >
                      {/* HEADER */}
                      <div className="px-5 py-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">Hidden Filters</h3>
                          <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">
                            {deletedFilters.length}
                          </span>
                        </div>
                        <button onClick={() => setShowDeletedFilters(false)} className="text-white/30 hover:text-white transition-all p-1.5 rounded-xl hover:bg-white/[0.05]">
                          <X size={16} />
                        </button>
                      </div>
                      
                      {/* BODY */}
                      <div className="max-h-64 overflow-y-auto p-3 custom-scrollbar space-y-1.5">
                        {deletedFilters.length === 0 ? (
                          <div className="py-10 text-center flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/[0.05]">
                              <Eraser size={18} className="text-white/10" />
                            </div>
                            <p className="text-[10px] font-black text-[#475569] uppercase tracking-[0.2em]">Bin is Empty</p>
                          </div>
                        ) : (
                          deletedFilters.map(filter => (
                            <div key={filter.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all group">
                              <span className="text-xs font-bold text-[#94a3b8] group-hover:text-white transition-colors tracking-tight">{filter.label}</span>
                              <button
                                onClick={() => restoreFilter(filter.id)}
                                className="px-3 py-1 bg-blue-600/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                Restore
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* FOOTER */}
                      <div className="p-5 bg-white/[0.01] border-t border-white/[0.05] flex gap-3">
                        <button 
                          onClick={restoreAllFilters}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[14px] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                        >
                          Restore All
                        </button>
                        <button 
                          onClick={() => setShowDeletedFilters(false)}
                          className="flex-1 py-3 bg-white/5 text-[#94a3b8] hover:text-white hover:bg-white/[0.08] text-[10px] font-black uppercase tracking-[0.2em] rounded-[14px] transition-all active:scale-[0.98]"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={quickActions.clear} className="text-[9px] font-bold text-primary hover:underline transition-all">Clear Optional</button>
              </div>
            </div>

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

            <div className="bg-muted/10 border border-border rounded-2xl p-4 space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar">
              {category === 'trades' && (
                <div className="space-y-2 mb-4">
                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase flex items-center gap-1.5">
                    <ListChecks size={10} /> Required Fields (Locked)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TRADE_PERMANENT_KEYS.map(key => (
                      <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] opacity-60">
                        <Check size={12} className="text-primary" />
                        <span className="text-[11px] font-medium text-muted-foreground">{formatLabel(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase flex items-center gap-1.5">
                  <Filter size={10} /> {category === 'trades' ? 'Optional Fields' : 'Available Fields'}
                </p>
                {availableOptionalFields.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableOptionalFields.map(field => (
                      <div
                        key={field}
                        className={`group relative flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${
                          selectedOptionalFields.includes(field)
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03]'
                        }`}
                      >
                        <button
                          onClick={() => toggleField(field)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                            selectedOptionalFields.includes(field)
                              ? 'bg-primary border-primary'
                              : 'bg-transparent border-muted-foreground/30'
                          }`}>
                            {selectedOptionalFields.includes(field) && <Check size={10} className="text-white" />}
                          </div>
                          <span className={`text-[11px] font-medium truncate ${selectedOptionalFields.includes(field) ? 'text-primary' : 'text-muted-foreground'}`}>{formatLabel(field)}</span>
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
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-[10px] text-muted-foreground italic">No optional fields detected</p>
                  </div>
                )}
              </div>
            </div>

            {category === 'trades' && (
              <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed px-1">
                * Required fields like <strong>PNL</strong> and <strong>Strategy</strong> are essential and cannot be removed.
              </p>
            )}
          </div>

          {format === 'xlsx' && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Export Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportMode('single')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all duration-300 ${
                    exportMode === 'single' // Default to single workbook
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <Table size={14} />
                  Single Workbook
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('separate')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all duration-300 ${
                    exportMode === 'separate'
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <div className="flex -space-x-1">
                    <Table size={12} className="opacity-50" />
                    <Table size={12} />
                  </div>
                  Separate Files
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/[0.03] transition-all duration-300 hover:border-primary/50 group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.05] transition-transform duration-300 group-hover:scale-110">
                <FileText size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Records found</p>
                <p className="text-[10px] text-muted-foreground">{data.length} items will be processed</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={includeMeta} onChange={e => setIncludeMeta(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        </div>

        <div className="p-6 bg-muted/10 border-t border-border flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-all duration-200 active:scale-95"
          >
            Cancel
          </button>
          <button 
            disabled={isExporting}
            onClick={handleExport}
            className="flex-[2] btn-primary flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl shadow-xl shadow-primary/20 transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : (
              <><Download size={16} /> Export File</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}