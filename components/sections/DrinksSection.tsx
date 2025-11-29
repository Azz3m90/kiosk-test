'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilters } from '@/hooks/useFilters';
import { useKiosk } from '@/context/KioskContext';
import { restaurantData } from '@/data/restaurant-data';
import { MenuItem } from '@/components/ui/MenuItem';
import { FilterBar } from '@/components/ui/FilterBar';
import type { DrinkItem } from '@/types';

const drinkCategories = ['all', 'hot', 'cold', 'alcoholic'];

export function DrinksSection() {
  const { t } = useTranslation();
  const { viewMode, gridColumns } = useKiosk();

  // Get all drink items
  const drinkItems = restaurantData.drinkItems;

  // Get initial price range for drink items
  const { initialMinPrice, initialMaxPrice } = useMemo(() => {
    if (!drinkItems || drinkItems.length === 0) {
      return { initialMinPrice: 0, initialMaxPrice: 15 };
    }
    const prices = drinkItems.map((item) => item.price);
    return {
      initialMinPrice: Math.floor(Math.min(...prices)),
      initialMaxPrice: Math.ceil(Math.max(...prices)),
    };
  }, [drinkItems]);

  // State for customizable boundaries
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize filters with current boundaries
  const { filters, updateCategory, updatePriceRange } = useFilters('drinks', minPrice, maxPrice);

  // Handle boundary changes
  const handleBoundariesChange = (newMin: number, newMax: number) => {
    setMinPrice(newMin);
    setMaxPrice(newMax);
  };

  // Dynamic grid classes and item constraints based on column count
  const getGridClass = () => {
    switch (gridColumns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  // Get item wrapper constraints for optimal sizing
  const getItemConstraints = () => {
    switch (gridColumns) {
      case 2:
        return 'max-w-md mx-auto'; // Max 448px - prevents items from being too wide
      case 3:
        return 'max-w-sm mx-auto'; // Max 384px - default balanced size
      case 4:
        return 'max-w-xs mx-auto'; // Max 320px - compact but still usable
      case 5:
        return ''; // No constraints for 5 columns - let grid handle sizing
      default:
        return 'max-w-sm mx-auto';
    }
  };

  // Get gap size based on column count
  const getGapClass = () => {
    switch (gridColumns) {
      case 2:
        return 'gap-6'; // Spacious for 2 columns
      case 3:
        return 'gap-6'; // Standard spacing
      case 4:
        return 'gap-4'; // Tighter for 4 columns
      case 5:
        return 'gap-2'; // Very compact for 5 columns
      default:
        return 'gap-6';
    }
  };

  // Apply filters
  const filteredItems = useMemo(() => {
    const hasSearchTerm = searchTerm.trim() !== '';
    
    return drinkItems.filter((item) => {
      // BEST PRACTICE: When searching, ignore category filter (search across all categories)
      // Only apply category filter when NOT searching
      if (!hasSearchTerm && filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      
      // Price filter (always applied)
      if (item.price < filters.priceMin || item.price > filters.priceMax) {
        return false;
      }
      
      // Search filter (searches across all categories when active)
      if (hasSearchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(searchLower);
        const descMatch = item.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [drinkItems, filters, searchTerm]);

  return (
    <section className="animate-fade-in pb-28">
      {/* Compact Section Header */}
      <div className="mb-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
          {t('drinks_title')}
        </h2>
      </div>

      {/* Compact Filter Bar with Integrated View Toggle */}
      <div className="mb-4">
        <FilterBar
          categories={drinkCategories}
          selectedCategory={filters.category}
          onCategoryChange={updateCategory}
          priceRange={[filters.priceMin, filters.priceMax]}
          onPriceRangeChange={(range) => updatePriceRange(range[0], range[1])}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onBoundariesChange={handleBoundariesChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          items={drinkItems}
        />
      </div>

      {/* Items Display - Grid or List */}
      {filteredItems.length > 0 ? (
        viewMode === 'grid' ? (
          // Grid View - Dynamic columns with item constraints
          <div className={`grid ${getGridClass()} ${getGapClass()}`}>
            {filteredItems.map((item: DrinkItem) => (
              <div key={item.id} className={`w-full ${getItemConstraints()}`}>
                <MenuItem item={item} viewMode="grid" gridColumns={gridColumns} />
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="flex flex-col gap-4">
            {filteredItems.map((item: DrinkItem) => (
              <MenuItem key={item.id} item={item} viewMode="list" />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xl">{t('no_items_found')}</p>
        </div>
      )}
    </section>
  );
}