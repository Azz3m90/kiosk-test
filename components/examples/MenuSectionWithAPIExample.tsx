'use client';

/**
 * EXAMPLE: MenuSection Component with API Integration
 * 
 * This is an example showing how to update MenuSection.tsx to use the real backend API
 * Replace the current import from restaurantData with useMenuData hook
 * 
 * To use this:
 * 1. Copy the relevant parts to components/sections/MenuSection.tsx
 * 2. Replace: import { restaurantData } from '@/data/restaurant-data';
 *    With: import { useMenuData } from '@/hooks/useMenuData';
 */

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilters } from '@/hooks/useFilters';
import { useKiosk } from '@/context/KioskContext';
import { useMenuData } from '@/hooks/useMenuData';
import { MenuItem } from '@/components/ui/MenuItem';
import { FilterBar } from '@/components/ui/FilterBar';
import type { MenuItem as MenuItemType } from '@/types';

export function MenuSectionWithAPIExample() {
  const { t } = useTranslation();
  const { viewMode, gridColumns } = useKiosk();

  // Fetch menu data from backend API
  const { categories, items, isLoading, error } = useMenuData({
    restaurant: process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Test-FastCaisse',
    enabled: true,
  });

  // Extract all category slugs (excluding 'all')
  const menuCategories = useMemo(() => {
    const slugs = categories
      .filter(cat => cat.slug !== 'all')
      .map(cat => cat.slug);
    return ['all', ...slugs];
  }, [categories]);

  // Get initial price range for all items
  const { initialMinPrice, initialMaxPrice } = useMemo(() => {
    if (!items || items.length === 0) {
      return { initialMinPrice: 0, initialMaxPrice: 30 };
    }
    const prices = items.map((item) => item.price);
    return {
      initialMinPrice: Math.floor(Math.min(...prices)),
      initialMaxPrice: Math.ceil(Math.max(...prices)),
    };
  }, [items]);

  // State for customizable boundaries
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize filters
  const { filters, updateCategory, updatePriceRange } = useFilters('food', minPrice, maxPrice);

  // Handle boundary changes
  const handleBoundariesChange = (newMin: number, newMax: number) => {
    setMinPrice(newMin);
    setMaxPrice(newMax);
  };

  // Dynamic grid classes
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

  const getItemConstraints = () => {
    switch (gridColumns) {
      case 2:
        return 'max-w-md mx-auto';
      case 3:
        return 'max-w-sm mx-auto';
      case 4:
        return 'max-w-xs mx-auto';
      case 5:
        return '';
      default:
        return 'max-w-sm mx-auto';
    }
  };

  const getGapClass = () => {
    switch (gridColumns) {
      case 2:
        return 'gap-6';
      case 3:
        return 'gap-6';
      case 4:
        return 'gap-4';
      case 5:
        return 'gap-2';
      default:
        return 'gap-6';
    }
  };

  // Apply filters to items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      // Price filter
      if (item.price < filters.priceMin || item.price > filters.priceMax) {
        return false;
      }
      // Name/Search filter
      if (searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(searchLower);
        const descMatch = item.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      return true;
    });
  }, [items, filters, searchTerm]);

  // Show loading state
  if (isLoading) {
    return (
      <section className="animate-fade-in pb-28">
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('loading') || 'Loading menu...'}</p>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="animate-fade-in pb-28">
        <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          <p className="text-red-600 dark:text-red-400 text-lg">
            {t('error') || 'Error loading menu'}
          </p>
          <p className="text-red-500 dark:text-red-300 text-sm mt-2">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in pb-28">
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
          {t('menu_title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mt-1">
          {t('menu_subtitle')}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-4">
        <FilterBar
          categories={menuCategories}
          selectedCategory={filters.category}
          onCategoryChange={updateCategory}
          priceRange={[filters.priceMin, filters.priceMax]}
          onPriceRangeChange={(range) => updatePriceRange(range[0], range[1])}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onBoundariesChange={handleBoundariesChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          items={items}
        />
      </div>

      {/* Items Display */}
      {filteredItems.length > 0 ? (
        viewMode === 'grid' ? (
          // Grid View
          <div className={`grid ${getGridClass()} ${getGapClass()}`}>
            {filteredItems.map((item: MenuItemType) => (
              <div key={item.id} className={`w-full ${getItemConstraints()}`}>
                <MenuItem item={item} viewMode="grid" gridColumns={gridColumns} />
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="flex flex-col gap-4">
            {filteredItems.map((item: MenuItemType) => (
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