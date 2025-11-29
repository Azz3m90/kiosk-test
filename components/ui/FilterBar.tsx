'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useKiosk } from '@/context/KioskContext';
import { SlidersHorizontal, LayoutGrid, List, Euro, Settings, Search, X, RotateCcw } from 'lucide-react';
import { formatPrice, getSafeImageUrl } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import type { GridColumns, FoodItem, DrinkItem } from '@/types';
import { OptimizedImage } from './OptimizedImage';
import { KeyboardInput } from '@/components/ui/KeyboardInput';

interface FilterBarProps {
  categories: string[];
  categoryNames?: Record<string, string>;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  onBoundariesChange?: (min: number, max: number) => void;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  items?: (FoodItem | DrinkItem)[]; // For search suggestions
}

export function FilterBar({
  categories,
  categoryNames = {},
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
  onBoundariesChange,
  searchTerm = '',
  onSearchChange,
  items = [],
}: FilterBarProps) {
  const { t } = useTranslation();
  const { viewMode, toggleViewMode, gridColumns, setGridColumns } = useKiosk();
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showBoundarySettings, setShowBoundarySettings] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Local state for customizable boundaries
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [tempMinBoundary, setTempMinBoundary] = useState(initialMinPrice);
  const [tempMaxBoundary, setTempMaxBoundary] = useState(initialMaxPrice);

  // Update local boundaries when props change
  useEffect(() => {
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
    setTempMinBoundary(initialMinPrice);
    setTempMaxBoundary(initialMaxPrice);
  }, [initialMinPrice, initialMaxPrice]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions based on search term
  const suggestions = searchTerm.trim() !== '' 
    ? items.filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return String(item.name ?? '').toLowerCase().includes(searchLower) || 
               String(item.description ?? '').toLowerCase().includes(searchLower);
      }).slice(0, 6) // Limit to 6 suggestions
    : [];

  const handleSuggestionClick = (itemName: string) => {
    if (onSearchChange) {
      onSearchChange(itemName);
      setShowSuggestions(false);
    }
  };

  const columnOptions: GridColumns[] = [2, 3, 4, 5];

  const handleColumnSelect = (col: GridColumns) => {
    setGridColumns(col);
    setShowColumnSelector(false);
  };

  const handleBoundaryUpdate = () => {
    const newMin = Math.min(tempMinBoundary, tempMaxBoundary - 1);
    const newMax = Math.max(tempMaxBoundary, tempMinBoundary + 1);
    
    setMinPrice(newMin);
    setMaxPrice(newMax);
    
    // Adjust current range if it's outside new boundaries
    const adjustedRange: [number, number] = [
      Math.max(newMin, Math.min(priceRange[0], newMax)),
      Math.min(newMax, Math.max(priceRange[1], newMin))
    ];
    
    if (adjustedRange[0] !== priceRange[0] || adjustedRange[1] !== priceRange[1]) {
      onPriceRangeChange(adjustedRange);
    }
    
    // Notify parent component if callback exists
    if (onBoundariesChange) {
      onBoundariesChange(newMin, newMax);
    }
    
    setShowBoundarySettings(false);
  };

  // Calculate clamped positions for the active range bar
  const minRatio = Math.max(0, Math.min(1, (priceRange[0] - minPrice) / (maxPrice - minPrice)));
  const maxRatio = Math.max(0, Math.min(1, (priceRange[1] - minPrice) / (maxPrice - minPrice)));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-300">
      {/* Grouped Filter Bar */}
      <div className="flex items-center gap-3 p-2.5 flex-wrap">
        
        {/* GROUP 1: Search & Filter Controls */}
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
          {/* Search Input - Compact with Suggestions */}
          {onSearchChange && (
            <>
              <div ref={searchRef} className="relative flex items-center flex-shrink-0 min-w-[200px] max-w-[280px]">
                <Search className="absolute left-2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                <div className="w-full relative">
                  <KeyboardInput
                    inputType="text"
                    value={searchTerm}
                    onChange={(e) => {
                      onSearchChange(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={t('search_items') || 'Search items...'}
                    aria-label={t('search_items') || 'Search items'}
                    className="w-full pl-8 pr-20 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600
                             text-gray-900 dark:text-gray-100 rounded-md transition-all
                             focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-gray-800
                             placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        onSearchChange('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-11 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-primary-200 dark:border-primary-700 z-50 max-h-[400px] overflow-y-auto">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSuggestionClick(item.name)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-left"
                      >
                        {/* Item Image */}
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <OptimizedImage
                            src={getSafeImageUrl(item.image)}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-sm font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                          {formatPrice(item.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
            </>
          )}
          
          {/* Category Filters */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
            <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md font-medium text-sm transition-all min-h-[36px] whitespace-nowrap',
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700'
                  )}
                >
                  {categoryNames[category] || t(category)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
          
          {/* Price Filter Button */}
          <button
            onClick={() => setShowPriceFilter(!showPriceFilter)}
            className={clsx(
              'px-2.5 py-1.5 rounded-md text-xs transition-all min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0',
              showPriceFilter 
                ? 'bg-primary-500 text-white shadow-sm' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700'
            )}
            title={`${t('filter_by_price')}: ${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`}
          >
            <Euro className="w-4 h-4" />
          </button>
        </div>

        {/* GROUP 2: View Options */}
        <div className="flex items-center gap-1 flex-shrink-0 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1.5 border border-gray-200 dark:border-gray-600">
          {/* Grid Button with Column Selector Popup */}
          <div className="relative">
            <button
              onClick={() => {
                if (viewMode === 'list') {
                  toggleViewMode();
                } else {
                  setShowColumnSelector(!showColumnSelector);
                }
              }}
              className={clsx(
                'min-w-[36px] min-h-[36px] w-9 h-9 rounded-md flex items-center justify-center transition-all relative',
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700'
              )}
              aria-label={t('grid_view')}
              title={viewMode === 'grid' ? 'Select grid columns' : t('grid_view')}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              {/* Current columns indicator - only visible in grid mode */}
              {viewMode === 'grid' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  {gridColumns}
                </span>
              )}
            </button>

            {/* Column Selector Popup - Only in grid mode */}
            {viewMode === 'grid' && showColumnSelector && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnSelector(false)}
                />
                
                {/* Popup */}
                <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 min-w-[280px] animate-fade-in">
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">
                      Grid Layout
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Select columns per row
                    </p>
                  </div>
                  
                  {/* Column Options Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {columnOptions.map((col) => (
                      <button
                        key={col}
                        onClick={() => handleColumnSelect(col)}
                        className={clsx(
                          'min-h-[64px] rounded-xl flex flex-col items-center justify-center gap-2 transition-all font-bold border-2',
                          gridColumns === col
                            ? 'bg-primary-500 text-white border-primary-600 shadow-lg scale-105'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 active:scale-95'
                        )}
                        aria-label={`${col} columns`}
                      >
                        <span className="text-3xl font-bold">{col}</span>
                        <span className="text-xs">
                          {col === 2 ? 'Wide' : col === 3 ? 'Default' : col === 4 ? 'Compact' : 'Dense'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* List Button */}
          <button
            onClick={viewMode === 'grid' ? toggleViewMode : undefined}
            className={clsx(
              'min-w-[36px] min-h-[36px] w-9 h-9 rounded-md flex items-center justify-center transition-all',
              viewMode === 'list'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700'
            )}
            aria-label={t('list_view')}
            title={t('list_view')}
          >
            <List className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Collapsible Compact Price Range Filter */}
      {showPriceFilter && (
        <div 
          className="bg-gray-50 dark:bg-gray-700 rounded-b-lg px-3 py-3 border-t border-gray-200 dark:border-gray-600 transition-colors duration-300"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {t('filter_by_price')}
              </span>
              {/* Settings button for boundary configuration */}
              <button
                onClick={() => setShowBoundarySettings(!showBoundarySettings)}
                className={clsx(
                  "p-1 rounded transition-colors",
                  showBoundarySettings
                    ? "bg-primary-500 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
                title="Configure price boundaries"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
            
            {!showBoundarySettings && (
              <div className="flex items-center gap-1.5 text-xs">

                <span className="text-gray-500 dark:text-gray-400 ml-1">
                   {formatPrice(minPrice)}-{formatPrice(maxPrice)}
                </span>
              </div>
            )}
          </div>

          {/* Boundary Configuration Panel */}
          {showBoundarySettings && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 mb-2 border border-gray-300 dark:border-gray-600">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Configure Price Range Boundaries
              </div>
              <div className="flex items-center gap-3 mb-3">
                {/* Minimum Boundary Input */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Start from:</span>
                  <div className="relative">
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">€</span>
                    <input
                      type="number"
                      min={0}
                      max={tempMaxBoundary - 1}
                      value={tempMinBoundary}
                      onChange={(e) => {
                        setTempMinBoundary(Math.max(0, Number(e.target.value)));
                      }}
                      className="w-20 pl-4 pr-1 py-1 text-xs text-center font-bold bg-gray-50 dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-600 rounded-md 
                               text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <span className="text-xs text-gray-400">to</span>

                {/* Maximum Boundary Input */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">End at:</span>
                  <div className="relative">
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">€</span>
                    <input
                      type="number"
                      min={tempMinBoundary + 1}
                      value={tempMaxBoundary}
                      onChange={(e) => {
                        setTempMaxBoundary(Math.max(tempMinBoundary + 1, Number(e.target.value)));
                      }}
                      className="w-20 pl-4 pr-1 py-1 text-xs text-center font-bold bg-gray-50 dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-600 rounded-md 
                               text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleBoundaryUpdate}
                  className="px-3 py-1 text-xs font-medium bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                >
                  Apply Boundaries
                </button>
                <button
                  onClick={() => {
                    setTempMinBoundary(minPrice);
                    setTempMaxBoundary(maxPrice);
                    setShowBoundarySettings(false);
                  }}
                  className="px-3 py-1 text-xs font-medium bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Quick Price Range Presets with Reset Button */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Quick Presets */}
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => onPriceRangeChange([minPrice, maxPrice])}
                className={clsx(
                  "px-2 py-0.5 text-xs font-medium rounded-md transition-colors",
                  priceRange[0] === minPrice && priceRange[1] === maxPrice
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                )}
              >
                All
              </button>
              {maxPrice >= 5 && (
                <button
                  onClick={() => onPriceRangeChange([minPrice, Math.min(5, maxPrice)])}
                  className={clsx(
                    "px-2 py-0.5 text-xs font-medium rounded-md transition-colors",
                    priceRange[0] === minPrice && priceRange[1] === Math.min(5, maxPrice)
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  )}
                >
                  €0-€5
                </button>
              )}
              {maxPrice >= 10 && minPrice <= 5 && (
                <button
                  onClick={() => onPriceRangeChange([Math.max(5, minPrice), Math.min(10, maxPrice)])}
                  className={clsx(
                    "px-2 py-0.5 text-xs font-medium rounded-md transition-colors",
                    priceRange[0] === Math.max(5, minPrice) && priceRange[1] === Math.min(10, maxPrice)
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  )}
                >
                  €5-€10
                </button>
              )}
              {maxPrice >= 15 && minPrice <= 10 && (
                <button
                  onClick={() => onPriceRangeChange([Math.max(10, minPrice), Math.min(15, maxPrice)])}
                  className={clsx(
                    "px-2 py-0.5 text-xs font-medium rounded-md transition-colors",
                    priceRange[0] === Math.max(10, minPrice) && priceRange[1] === Math.min(15, maxPrice)
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  )}
                >
                  €10-€15
                </button>
              )}
              {maxPrice > 15 && minPrice <= 15 && (
                <button
                  onClick={() => onPriceRangeChange([Math.max(15, minPrice), maxPrice])}
                  className={clsx(
                    "px-2 py-0.5 text-xs font-medium rounded-md transition-colors",
                    priceRange[0] === Math.max(15, minPrice) && priceRange[1] === maxPrice
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  )}
                >
                  €15+
                </button>
              )}
            </div>

            {/* Reset Button - Kiosk Optimized */}
            <button
              onClick={() => onPriceRangeChange([minPrice, maxPrice])}
              disabled={priceRange[0] === minPrice && priceRange[1] === maxPrice}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-all shadow-sm",
                "min-h-[44px] min-w-[44px]", // Kiosk touch target minimum
                priceRange[0] === minPrice && priceRange[1] === maxPrice
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:scale-95 shadow-md hover:shadow-lg"
              )}
              title={t('reset_filter') || 'Reset price filter'}
              aria-label={t('reset_filter') || 'Reset price filter'}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="whitespace-nowrap">Reset</span>
            </button>
          </div>
          
          <div className="relative h-6 flex items-center px-2 price-range-container mb-6">
            {/* Background track */}
            <div className="absolute left-2 right-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            {/* Active range */}
            <div 
              className="absolute h-1.5 bg-primary-500 rounded-full"
              style={{
                left: `calc(0.5rem + (100% - 1rem) * ${minRatio})`,
                width: `calc((100% - 1rem) * ${maxRatio - minRatio})`,
              }}
            ></div>
            {/* Min range slider */}
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={priceRange[0]}
              onChange={(e) => {
                const newMin = Number(e.target.value);
                if (newMin <= priceRange[1]) {
                  onPriceRangeChange([newMin, priceRange[1]]);
                }
              }}
              className="absolute left-2 right-2 appearance-none bg-transparent cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                       [&::-webkit-slider-thumb]:bg-primary-500 dark:[&::-webkit-slider-thumb]:bg-primary-400 
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-gray-800
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md 
                       [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                       [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-110
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                       [&::-moz-range-thumb]:bg-primary-500 dark:[&::-moz-range-thumb]:bg-primary-400 
                       [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-gray-800
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md 
                       [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-all
                       [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-110"
              style={{ 
                zIndex: priceRange[0] > (priceRange[1] - (maxPrice - minPrice) * 0.15) ? 2 : 1
              }}
            />
            {/* Max range slider */}
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => {
                const newMax = Number(e.target.value);
                if (newMax >= priceRange[0]) {
                  onPriceRangeChange([priceRange[0], newMax]);
                }
              }}
              className="absolute left-2 right-2 appearance-none bg-transparent cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                       [&::-webkit-slider-thumb]:bg-primary-500 dark:[&::-webkit-slider-thumb]:bg-primary-400 
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-gray-800
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md 
                       [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                       [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-110
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                       [&::-moz-range-thumb]:bg-primary-500 dark:[&::-moz-range-thumb]:bg-primary-400 
                       [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-gray-800
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md 
                       [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-all
                       [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-110"
              style={{ 
                zIndex: priceRange[0] > (priceRange[1] - (maxPrice - minPrice) * 0.15) ? 1 : 2
              }}
            />
            
            {/* Price labels under the dots (slider handles) */}
            <div 
              className="absolute top-5 -translate-x-1/2 pointer-events-none transition-all duration-200"
              style={{
                left: `calc(0.5rem + (100% - 1rem) * ${minRatio})`,
              }}
            >
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                {formatPrice(priceRange[0])}
              </span>
            </div>
            <div 
              className="absolute top-5 -translate-x-1/2 pointer-events-none transition-all duration-200"
              style={{
                left: `calc(0.5rem + (100% - 1rem) * ${maxRatio})`,
              }}
            >
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                {formatPrice(priceRange[1])}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}