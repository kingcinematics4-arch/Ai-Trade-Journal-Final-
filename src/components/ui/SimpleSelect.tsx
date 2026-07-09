'use client';
import React from 'react';
import SearchableSelect from './SearchableSelect';

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
  return (
    <SearchableSelect
      label={label}
      items={items}
      value={value}
      onSelect={onSelect}
      placeholder={placeholder}
      error={error}
      searchable={false}
    />
  );
}
