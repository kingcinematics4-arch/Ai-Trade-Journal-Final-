'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Check, Settings2, Loader2, Table, Filter, ListChecks, Trash2, AlertTriangle, RefreshCcw, Eraser, Search, Calendar as CalendarIcon } from 'lucide-react';
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
  const [pdfReportType, setPdfReportType] = useState<'standard' | 'detailed'>('standard');
  const [selectedOptionalFields, setSelectedOptionalFields] = useState<string[]>([]);
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  const [deletedFilters, setDeletedFilters] = useState<{ id: string; label: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
        .filter(k => formatLabel(k).toLowerCase().includes(searchTerm.toLowerCase()))
        .sort();
      setAvailableOptionalFields(optional);
    }
  }, [isOpen, data, category, deletedFilters, searchTerm]);

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
        exportMode: exportMode,
        pdfReportType: format === 'pdf' ? pdfReportType : undefined,
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl transition-all duration-300 ease-out animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-5xl bg-card border border-border rounded-[32px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <Settings2 size={18} className="text-primary" />
            <h3 className="font-black uppercase tracking-[0.2em] text-sm text-foreground">Export Architect</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-all duration-200 text-muted-foreground hover:scale-110 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto lg:p-8 custom-scrollbar flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-[38%_1fr] gap-10">
            {/* LEFT COLUMN */}
            <div className="space-y-7">
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
                <div className="grid grid-cols-2 gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(f.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-bold transition-all duration-300 ${
                        format === f.value 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-muted/20 border-border text-muted-foreground'
                      }`}
                    >
                      <span>{f.icon}</span>
                      {f.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {format === 'pdf' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">PDF Report Type</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setPdfReportType('standard')}
                      className={`w-full text-left p-3 rounded-xl border text-[11px] font-bold transition-all ${
                        pdfReportType === 'standard' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/20 border-border text-muted-foreground'
                      }`}
                    >
                      Standard Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfReportType('detailed')}
                      className={`w-full text-left p-3 rounded-xl border text-[11px] font-bold transition-all ${
                        pdfReportType === 'detailed' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/20 border-border text-muted-foreground'
                      }`}
                    >
                      Detailed Log
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col h-full min-h-[500px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Export Fields</label>
                  <div className="flex gap-2 relative">
                    <button onClick={quickActions.tradingEssentials} className="text-[9px] font-bold text-primary hover:underline transition-all">Essentials</button>
                    <button onClick={quickActions.selectAll} className="text-[9px] font-bold text-primary hover:underline transition-all">All</button>
                    <button onClick={quickActions.clear} className="text-[9px] font-bold text-muted-foreground hover:text-white transition-all">Clear</button>
                    
                    {deletedFilters.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setShowDeletedFilters(!showDeletedFilters)}
                        className={`text-[9px] font-black flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                          showDeletedFilters 
                            ? 'bg-amber-500 text-white border-amber-500' 
                            : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                        }`}
                      >
                        Edit Bin ({deletedFilters.length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search optional fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary/50 outline-none"
                  />
                </div>

                <div className="bg-muted/5 border border-border rounded-2xl p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {category === 'trades' && (
                    <div className="space-y-2 mb-4">
                      <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                        <ListChecks size={10} /> Mandatory Fields
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {TRADE_PERMANENT_KEYS.map(key => (
                          <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] opacity-60">
                            <Check size={10} className="text-primary" />
                            <span className="text-[10px] font-bold text-muted-foreground">{formatLabel(key)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                      <Filter size={10} /> Optional Data Points
                    </p>
                    {availableOptionalFields.length > 0 ? (
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
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
                              <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${
                                selectedOptionalFields.includes(field)
                                  ? 'bg-primary border-primary'
                                  : 'bg-transparent border-muted-foreground/30'
                              }`}>
                                {selectedOptionalFields.includes(field) && <Check size={8} className="text-white" />}
                              </div>
                              <span className={`text-[10px] font-bold truncate ${selectedOptionalFields.includes(field) ? 'text-primary' : 'text-muted-foreground'}`}>{formatLabel(field)}</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setFilterToDelete(field); }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-xs text-muted-foreground italic">No fields match your search</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Selected Format</span>
                <span className="text-xs font-bold text-primary">{FORMATS.find(f => f.value === format)?.label}</span>
             </div>
             <div className="w-px h-8 bg-border" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Report Depth</span>
                <span className="text-xs font-bold text-white">{format === 'pdf' ? pdfReportType.toUpperCase() : 'N/A'}</span>
             </div>
           </div>

           <div className="flex gap-3">
             <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-muted-foreground hover:text-white transition-colors">Cancel</button>
             <button 
                disabled={isExporting}
                onClick={handleExport}
                className="px-10 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Generate Institutional Export
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}