'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/hooks/useTranslation';

interface Item {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
  [key: string]: any;
}

interface SearchableSelectProps {
  label?: string;
  helperText?: string;
  items: any[];
  value: string;
  onSelect: (value: string) => void;
  onDelete?: (item: any) => void;
  onAddCustom?: (value: string) => void;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
  buttonClassName?: string;
  searchPlaceholder?: string;
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
  searchable = true,
  buttonClassName = '',
  searchPlaceholder,
}: SearchableSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const normalizedItems = useMemo(() => {
    return items.map((item, index) => {
      if (typeof item === 'string') {
        return { id: item, label: item, value: item };
      }
      if (item && typeof item === 'object') {
        return {
          id: item.id || item.value || `item-${index}`,
          label: item.label || item.name || item.symbol || item.value || '',
          value: item.value !== undefined ? item.value : item.id || item.symbol || '',
          ...item,
        };
      }
      return { id: String(item), label: String(item), value: String(item) };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchable || !searchTerm) return normalizedItems;
    return normalizedItems.filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [normalizedItems, searchTerm, searchable]);

  const selectedItem = useMemo(() => {
    return normalizedItems.find((i) => i.value === value || i.id === value);
  }, [normalizedItems, value]);

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -4, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed z-[9999] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {searchable && (
            <div className="p-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900">
              <Search size={14} className="text-zinc-500" />
              <input
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-600 p-1"
                placeholder={searchPlaceholder || t('trading.addTrade.searchable.searchOrAdd')}
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
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1 bg-zinc-900 scrollbar-none">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    value === item.value || value === item.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
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
                <p className="text-xs text-zinc-500 font-medium">
                  {t('trading.addTrade.searchable.noMatches') || 'No matches found'}
                </p>
                {onAddCustom && searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddCustom(searchTerm);
                      setSearchTerm('');
                    }}
                    className="mt-2 text-xs text-blue-400 hover:underline font-semibold"
                  >
                    {t('trading.addTrade.searchable.addCustom', { term: searchTerm }) || `Add "${searchTerm}"`}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ADD_TRADE_TRIGGER_CLASS =
    'form-input bg-zinc-950 border-zinc-800 text-white rounded-xl py-3 px-4';
  const triggerClass = buttonClassName || ADD_TRADE_TRIGGER_CLASS;

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="form-label text-white">{label}</label>}
      {helperText && <p className="form-helper text-zinc-500">{helperText}</p>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-all ${triggerClass} ${
          isOpen ? 'border-zinc-500 ring-1 ring-zinc-500' : ''
        } ${error ? 'border-red-500' : ''}`}
      >
        <span className={`text-sm truncate ${value ? 'text-white' : 'text-zinc-500'}`}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
          size={16}
        />
      </button>

      {error && <p className="form-error mt-1 text-red-500 text-xs">{error}</p>}

      {typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
