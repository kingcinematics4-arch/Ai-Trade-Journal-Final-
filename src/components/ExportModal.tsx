'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Check, Settings2, Loader2, Table, Filter, ListChecks } from 'lucide-react';
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
  const [availableOptionalFields, setAvailableOptionalFields] = useState<string[]>([]);
  const [includeMeta, setIncludeMeta] = useState(true);

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

  // Detect available fields
  useEffect(() => {
    if (isOpen && data && data.length > 0) {
      const permanent = category === 'trades' ? TRADE_PERMANENT_KEYS : [];
      const allKeys = new Set<string>();
      data.slice(0, 10).forEach(item => {
        getFlatKeys(item).forEach(k => allKeys.add(k));
      });
      const optional = Array.from(allKeys).filter(k => !permanent.includes(k)).sort();
      setAvailableOptionalFields(optional);
    }
  }, [isOpen, data, category]);

  const toggleField = (field: string) => {
    const next = selectedOptionalFields.includes(field)
      ? selectedOptionalFields.filter(f => f !== field)
      : [...selectedOptionalFields, field];
    setSelectedOptionalFields(next);
    localStorage.setItem(`export_fields_${category}`, JSON.stringify(next));
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
              <div className="flex gap-2">
                <button onClick={quickActions.tradingEssentials} className="text-[9px] font-bold text-primary hover:underline transition-all">Trading Essentials</button>
                <button onClick={quickActions.selectAll} className="text-[9px] font-bold text-primary hover:underline transition-all">Select All</button>
                <button onClick={quickActions.clear} className="text-[9px] font-bold text-primary hover:underline transition-all">Clear Optional</button>
              </div>
            </div>

            <div className="bg-muted/10 border border-border rounded-2xl p-4 space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar">
              {category === 'trades' && (
                <div className="space-y-2">
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
                      <button
                        key={field}
                        onClick={() => toggleField(field)}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 text-left ${
                          selectedOptionalFields.includes(field)
                            ? 'bg-primary/5 border-primary/30 text-primary'
                            : 'bg-white/[0.01] border-white/[0.05] text-muted-foreground hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                          selectedOptionalFields.includes(field)
                            ? 'bg-primary border-primary'
                            : 'bg-transparent border-muted-foreground/30'
                        }`}>
                          {selectedOptionalFields.includes(field) && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-[11px] font-medium truncate">{formatLabel(field)}</span>
                      </button>
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
              <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed">
                * Permanent fields like <strong>PNL</strong> and <strong>Strategy</strong> are essential for professional review and cannot be removed.
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