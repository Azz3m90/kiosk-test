'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilters } from '@/hooks/useFilters';
import { useKiosk } from '@/context/KioskContext';
import { useMenuData } from '@/hooks/useMenuData';
import { MenuItem } from '@/components/ui/MenuItem';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FoodItem, DrinkItem } from '@/types';

export function MenuSection() {
  const { t } = useTranslation();
  const { viewMode, gridColumns, restaurantName: contextRestaurantName } = useKiosk();
  
  // Use stored restaurant name from context, fallback to env variable
  const restaurantName = contextRestaurantName || process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Test-FastCaisse';
  
  // Fetch menu data from Laravel backend via Next.js API
  const { 
    categories: apiCategories, 
    items: apiItems, 
    isLoading, 
    error 
  } = useMenuData({ 
    restaurant: restaurantName,
    enabled: true 
  });

  // Map API categories to the format expected by FilterBar and create slug-to-name mapping
  const { menuCategories, categoryNameToSlug, categorySlugToName } = useMemo(() => {
    const slugs = apiCategories.map(cat => cat.slug);
    const nameToSlug: Record<string, string> = {};
    const slugToName: Record<string, string> = {};
    apiCategories.forEach(cat => {
      nameToSlug[cat.name] = cat.slug;
      slugToName[cat.slug] = cat.name;
    });
    return { menuCategories: slugs, categoryNameToSlug: nameToSlug, categorySlugToName: slugToName };
  }, [apiCategories]);

  // Use API items or fallback to empty array (keep category as slug for filtering)
  // Filter out items with null/empty names to prevent displaying "null" in the UI
  const allMenuItems = useMemo(() => {
    return (apiItems || []).filter(item => item && item.name && String(item.name).trim().length > 0) as (FoodItem | DrinkItem)[];
  }, [apiItems]);

  // Get initial price range for all items
  const { initialMinPrice, initialMaxPrice } = useMemo(() => {
    if (!allMenuItems || allMenuItems.length === 0) {
      return { initialMinPrice: 0, initialMaxPrice: 30 };
    }
    const prices = allMenuItems.map((item) => item.price);
    return {
      initialMinPrice: Math.floor(Math.min(...prices)),
      initialMaxPrice: Math.ceil(Math.max(...prices)),
    };
  }, [allMenuItems]);

  // State for customizable boundaries
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize filters with current boundaries
  const { filters, updateCategory, updatePriceRange } = useFilters('food', minPrice, maxPrice);

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

  // Apply filters to combined menu items
  const filteredItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      // Category filter - now comparing category names
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
        const nameMatch = String(item.name ?? '').toLowerCase().includes(searchLower);
        const descMatch = String(item.description ?? '').toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      return true;
    });
  }, [allMenuItems, filters, searchTerm]);

  // Loading state
  if (isLoading) {
    return (
      <section className="animate-fade-in pb-28">
        <div className="mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            {t('menu_title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mt-1">
            {t('menu_subtitle')}
          </p>
        </div>
        
        {/* Loading skeleton */}
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
            {t('loading') || 'Loading menu...'}
          </p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="animate-fade-in pb-28">
        <div className="mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            {t('menu_title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mt-1">
            {t('menu_subtitle')}
          </p>
        </div>

        <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-sm border-2 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">
            {t('error') || 'Error loading menu'}
          </p>
          <p className="text-red-500 dark:text-red-300 text-sm mt-2">
            {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in pb-28">
      {/* Compact Section Header */}
      <div className="mb-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
          {t('menu_title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mt-1">
          {t('menu_subtitle')}
        </p>
      </div>

      {/* Compact Filter Bar with Integrated View Toggle */}
      <div className="mb-4">
        <FilterBar
          categories={menuCategories}
          categoryNames={categorySlugToName}
          selectedCategory={filters.category}
          onCategoryChange={updateCategory}
          priceRange={[filters.priceMin, filters.priceMax]}
          onPriceRangeChange={(range) => updatePriceRange(range[0], range[1])}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onBoundariesChange={handleBoundariesChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          items={allMenuItems}
        />
      </div>

      {/* Items Display - Grid or List */}
      {filteredItems.length > 0 ? (
        viewMode === 'grid' ? (
          // Grid View - Dynamic columns with item constraints
          <div className={`grid ${getGridClass()} ${getGapClass()}`}>
            {filteredItems.map((item: FoodItem | DrinkItem) => (
              <div key={item.id} className={`w-full ${getItemConstraints()}`}>
                <MenuItem item={item} viewMode="grid" gridColumns={gridColumns} categoryNames={categorySlugToName} />
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="flex flex-col gap-4">
            {filteredItems.map((item: FoodItem | DrinkItem) => (
              <MenuItem key={item.id} item={item} viewMode="list" categoryNames={categorySlugToName} />
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