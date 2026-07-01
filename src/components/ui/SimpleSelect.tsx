'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  id: string;
  label: string;
  value: string;
  [key: string]: any;
}

interface SimpleSelectProps {
  label: string;
  items: Item[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function SimpleSelect({
  label,
  items,
  value,
  onSelect,
  placeholder = 'Select option...',
  error,
}: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectedItem = items.find((i) => i.value === value || i.id === value);

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
          <div className="max-h-60 overflow-y-auto p-1 bg-zinc-900">
            {items.map((item) => (
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
                }}
              >
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <label className="form-label text-white">{label}</label>

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
        <ChevronDown
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {error && <p className="form-error mt-1 text-red-500 text-xs">{error}</p>}

      {typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
