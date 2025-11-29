'use client';

import React, { useRef, useState } from 'react';
import { useKeyboard } from '@/context/KeyboardContext';
import { Keyboard } from 'lucide-react';

interface ExpiryDateInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  placeholder?: string;
  'aria-label'?: string;
}

export function ExpiryDateInput({
  value,
  onChange,
  error,
  className = '',
  placeholder = "MM/YY",
  'aria-label': ariaLabel,
}: ExpiryDateInputProps) {
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const { showKeyboard } = useKeyboard();

  // Split the value into month and year
  const [month, year] = value.split('/').map(v => v.trim());

  const handleMonthFocus = () => {
    if (monthInputRef.current) {
      showKeyboard(monthInputRef.current, 'number');
    }
  };

  const handleYearFocus = () => {
    if (yearInputRef.current) {
      showKeyboard(yearInputRef.current, 'number');
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newMonth = e.target.value.replace(/\D/g, '').slice(0, 2);
    const monthNum = parseInt(newMonth, 10);

    // Auto-correct invalid months
    if (monthNum > 12) {
      newMonth = '12';
    } else if (monthNum === 0 && newMonth.length === 2) {
      newMonth = '01';
    }

    // Update the combined value
    const newValue = year ? `${newMonth}/${year}` : newMonth;
    onChange(newValue);

    // Auto-focus year input when valid month is entered
    if (newMonth.length === 2 && monthNum > 0 && monthNum <= 12) {
      yearInputRef.current?.focus();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = e.target.value.replace(/\D/g, '').slice(0, 2);
    
    // Simply update the value without auto-correction
    const newValue = month ? `${month}/${newYear}` : newYear;
    onChange(newValue);
  };

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !month) {
      e.preventDefault();
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = yearInputRef.current;
    if (e.key === 'Backspace') {
      // If year is empty or cursor is at start, move to month field
      if (!year || (input && input.selectionStart === 0 && input.selectionEnd === 0)) {
        e.preventDefault();
        monthInputRef.current?.focus();
        // Position cursor at end of month field
        setTimeout(() => {
          if (monthInputRef.current) {
            monthInputRef.current.setSelectionRange(month?.length || 0, month?.length || 0);
          }
        }, 0);
      }
    }
  };

  const baseInputClass = `
    w-32
    px-4 
    py-3 
    text-xl 
    font-semibold
    rounded-lg 
    border 
    ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
    focus:border-primary-500 
    dark:focus:border-primary-400 
    text-center 
    bg-white 
    dark:bg-gray-800
    ${className}
  `;

  return (
    <div className="flex items-center gap-3">
      {/* Month Input */}
      <div className="relative">
        <input
          ref={monthInputRef}
          type="text"
          inputMode="numeric"
          value={month || ''}
          onChange={handleMonthChange}
          onKeyDown={handleMonthKeyDown}
          onFocus={handleMonthFocus}
          placeholder="MM"
          aria-label={`${ariaLabel || 'Expiry'} month`}
          className={baseInputClass}
          maxLength={2}
        />
        <button
          type="button"
          onClick={handleMonthFocus}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/50 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Show keyboard for month"
          tabIndex={-1}
        >
          <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </button>
      </div>

      <span className="text-2xl font-bold select-none text-gray-600 dark:text-gray-400">/</span>

      {/* Year Input */}
      <div className="relative">
        <input
          ref={yearInputRef}
          type="text"
          inputMode="numeric"
          value={year || ''}
          onChange={handleYearChange}
          onKeyDown={handleYearKeyDown}
          onFocus={handleYearFocus}
          placeholder="YY"
          aria-label={`${ariaLabel || 'Expiry'} year`}
          className={baseInputClass}
          maxLength={2}
        />
        <button
          type="button"
          onClick={handleYearFocus}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/50 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Show keyboard for year"
          tabIndex={-1}
        >
          <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </button>
      </div>
    </div>
  );
}