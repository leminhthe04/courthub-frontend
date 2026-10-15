'use client';

import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
}

function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  noResultsText = 'No results found',
  disabled = false,
  isLoading = false,
  loadingText = 'Loading...',
  className = '',
}: SearchableSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const normalizedQuery = normalizeVietnamese(query);
    return options.filter((opt) => normalizeVietnamese(opt.label).includes(normalizedQuery));
  }, [options, query]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded border border-slate-200 bg-white px-4 py-2.5 text-left transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          isOpen ? 'border-emerald-600 ring-1 ring-emerald-500' : 'hover:border-slate-300'
        }`}
      >
        <span
          className={`block truncate ${!selectedOption ? 'text-slate-400' : ' text-slate-800'}`}
        >
          {isLoading ? loadingText : selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <>
              {value && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClear(e as unknown as React.MouseEvent);
                    }
                  }}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Clear selection"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </>
          )}
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 w-full rounded-md border border-slate-200 bg-white shadow-xl">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-7 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1 text-sm focus:outline-none">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-center text-xs text-slate-400">{noResultsText}</li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
