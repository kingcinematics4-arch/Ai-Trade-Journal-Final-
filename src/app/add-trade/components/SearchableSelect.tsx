'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
  [key: string]: any;
}

interface SearchableSelectProps {
  label: string;
  helperText?: string;
  items: Item[];
  value: string;
  onSelect: (value: string) => void;
  onDelete?: (item: Item) => void;
  onAddCustom?: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function SearchableSelect({
  label,
  helperText,
  items,
  value,
  onSelect,
  onDelete,
  onAddCustom,
  placeholder = 'Select option...',
  error,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = items.find((i) => i.value === value || i.id === value);

  return (
    <div className="relative" ref={containerRef}>
      <label className="form-label text-white">{label}</label>
      {helperText && <p className="form-helper text-zinc-500">{helperText}</p>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between form-input mt-1.5 bg-zinc-950 border-zinc-800 text-white rounded-xl py-3 px-4 transition-all ${
          isOpen ? 'border-zinc-500 ring-1 ring-zinc-500' : ''
        } ${error ? 'border-red-500' : ''}`}
      >
        <span className={value ? 'text-white' : 'text-zinc-500'}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>

      {error && <p className="form-error mt-1 text-red-500 text-xs">{error}</p>}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-[100] w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900">
              <Search size={14} className="text-zinc-500" />
              <input
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-600 p-1"
                placeholder="Search or add custom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm && onAddCustom) {
                    onAddCustom(searchTerm);
                    setSearchTerm('');
                  }
                }}
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="text-zinc-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto p-1 bg-zinc-900">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      value === item.value || value === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                    onClick={() => {
                      onSelect(item.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <span className="text-sm">{item.label}</span>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-red-400 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-500">No matches found</p>
                  {onAddCustom && searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddCustom(searchTerm);
                        setSearchTerm('');
                      }}
                      className="mt-2 text-xs text-blue-400 hover:underline"
                    >
                      Add "{searchTerm}" as custom
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}