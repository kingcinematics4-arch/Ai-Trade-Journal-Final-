'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchableSelectProps {
  label: string;
  helperText?: string;
  placeholder?: string;
  items: any[];
  value: string;
  onSelect: (value: string) => void;
  onDelete?: (item: any) => void;
  onAddCustom?: (searchValue: string) => void;
  searchPlaceholder?: string;
  error?: string;
}

export default function SearchableSelect({
  label,
  helperText,
  placeholder = 'Select option',
  items,
  value,
  onSelect,
  onDelete,
  onAddCustom,
  searchPlaceholder = 'Search...',
  error,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = useMemo(() =>
    items.find(i => (i.value !== undefined ? i.value : (i.id || i.symbol || i.name)) === value),
    [items, value]
  );

  const displayValue = selectedItem?.label || selectedItem?.name || (value === '' ? '' : value) || placeholder;

  const filteredItems = items.filter((item) =>
    (item.label || item.symbol || item.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const showAddCustom = onAddCustom && search.trim() && !items.some(
    (item) => (item.label || item.symbol || item.name || '').toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div className="relative" ref={containerRef}>
      <label className="form-label text-white">{label}</label>
      {helperText && <p className="form-helper text-zinc-500">{helperText}</p>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all ${
          isOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50' : ''
        }`}
      >
        <span className={value ? 'text-white' : 'text-zinc-500'}>
          {displayValue}
        </span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/[0.05]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input 
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-none">
              {filteredItems.map((item) => (
                <div
                  key={item.id || item.symbol || item.name || item.value}
                  onClick={() => { onSelect(item.id || item.value || item.symbol); setIsOpen(false); setSearch(''); }}
                  className="flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer hover:bg-zinc-800 hover:text-white"
                >
                  <span>{item.label || item.symbol || item.name}</span>
                </div>
              ))}
              {showAddCustom && (
                <button
                  type="button"
                  onClick={() => { onAddCustom(search); setSearch(''); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-blue-400 rounded-xl hover:bg-white/[0.06] flex items-center gap-2"
                >
                  <PlusCircle size={14} />
                  <span>Add "{search}"</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="form-error mt-1">{error}</p>}
    </div>
  );
}