'use client';

import React, { useState, useCallback } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-muted-foreground" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          className="block w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
          placeholder="Search traders by name or username..."
        />
      </div>
      <div className="flex gap-3">
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Filter size={16} />
          Filters
        </button>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUpDown size={16} />
          Sort
        </button>
      </div>
    </div>
  );
}
