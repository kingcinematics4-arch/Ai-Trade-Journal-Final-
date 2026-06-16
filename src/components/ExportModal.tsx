'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Check, Settings2, Loader2, Table } from 'lucide-react';
import { exportData } from '@/app/exports/exportEngine';
import { logExport, ExportFormat } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';

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
  const [includeMeta, setIncludeMeta] = useState(true);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    const loadingToast = toast.loading('Architecting professional report...');
    
    try {
      // Execute the export via the specialized export engine
      const success = await exportData(data, {
        fileName: filename,
        format: format as any,
        selectedFields: [],
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