'use client';

import { useState } from 'react';
import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice, getSafeImageUrl } from '@/lib/utils';
import { Plus, Minus, Star } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import type { MenuItem as MenuItemType } from '@/types';
import { ItemOptionsModal } from './ItemOptionsModal';

interface MenuItemProps {
  item: MenuItemType;
  viewMode?: 'grid' | 'list';
  gridColumns?: number;
  categoryNames?: Record<string, string>;
}

export function MenuItem({ item, viewMode = 'grid', gridColumns, categoryNames }: MenuItemProps) {
  const { addToCart, viewMode: contextViewMode, gridColumns: contextGridColumns } = useKiosk();
  const { t } = useTranslation();
  
  // Check if item has customizable options (additions or menu categories, not regular options)
  const hasCustomizableOptions = () => {
    if (!item.options || item.options.length === 0) return false;
    return item.options.some(option => 
      option.sourceType === 'addition' || option.sourceType === 'menuCategory'
    );
  };
  
  // Get display name for category
  const getCategoryDisplay = (category: string) => {
    if (categoryNames?.[category]) {
      return categoryNames[category];
    }
    return t(category) || category;
  };
  
  // Use the prop if provided, otherwise use the context value
  const currentViewMode = viewMode || contextViewMode;
  const currentGridColumns = gridColumns ?? contextGridColumns;
  const isCompactMode = currentGridColumns >= 4;
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    // Always show modal to allow special instructions for all items
    setShowOptionsModal(true);
  };

  return (
    <>
      {currentViewMode === 'grid' ? (
        isCompactMode ? (
          // Compact Centered Mode (4-5 columns)
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full">
            {/* Item Image - Circular for compact mode */}
            <div className="relative pt-6 pb-3 flex justify-center">
              <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-gray-700">
                <OptimizedImage
                  src={getSafeImageUrl(item.image)}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            </div>

            {/* Item Details - Centered */}
            <div className="px-3 pb-4 flex flex-col items-center text-center flex-grow">
              {/* Category Badge */}
              <div className="mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {getCategoryDisplay(item.category)}
                </span>
              </div>
              
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 min-h-[2.5rem]">
                {item.name || 'Unnamed Item'}
              </h3>

              {/* Price - Prominent */}
              <div className="mb-3">
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(item.price)}
                </span>
              </div>

              {/* Quantity Controls - Compact Horizontal */}
              <div className="flex items-center gap-2 mb-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-2 py-1.5">
                <button
                  onClick={decrementQuantity}
                  className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg bg-white dark:bg-gray-600 hover:bg-primary-50 dark:hover:bg-gray-500 active:scale-95 flex items-center justify-center transition-all shadow-sm"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300 stroke-[3]" />
                </button>
                <span className="text-base font-bold text-gray-800 dark:text-gray-100 w-6 text-center">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg bg-white dark:bg-gray-600 hover:bg-primary-50 dark:hover:bg-gray-500 active:scale-95 flex items-center justify-center transition-all shadow-sm"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300 stroke-[3]" />
                </button>
              </div>

              {/* Add Button - Full Width */}
              <button
                onClick={handleAddToCart}
                className="btn-primary w-full min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold transition-all active:scale-95 hover:shadow-lg rounded-xl"
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t('add')}</span>
              </button>

              {/* Options Indicator */}
              {hasCustomizableOptions() && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                  {t('customizable')}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Standard Grid View (2-3 columns)
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full">
            {/* Item Image */}
            <div className="relative h-48 lg:h-56 overflow-hidden">
              <OptimizedImage
                src={getSafeImageUrl(item.image)}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
              {/* Category Badge */}
              <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {getCategoryDisplay(item.category)}
                </span>
              </div>
            </div>

            {/* Item Details */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-1">
                {item.name || 'Unnamed Item'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 h-10">
                {item.description || 'No description available'}
              </p>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(item.price)}
                </span>
              </div>

              {/* Quantity Controls and Add Button */}
              <div className="flex items-center gap-2 w-full">
                {/* Quantity Controls - Kiosk Optimized */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-1.5 py-1 flex-shrink-0">
                  <button
                    onClick={decrementQuantity}
                    className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg bg-white dark:bg-gray-600 hover:bg-primary-50 dark:hover:bg-gray-500 active:scale-95 flex items-center justify-center transition-all shadow-sm hover:shadow-md"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5 text-gray-700 dark:text-gray-300 stroke-[3]" />
                  </button>
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100 w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg bg-white dark:bg-gray-600 hover:bg-primary-50 dark:hover:bg-gray-500 active:scale-95 flex items-center justify-center transition-all shadow-sm hover:shadow-md"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300 stroke-[3]" />
                  </button>
                </div>
                {/* Add Button - Kiosk Optimized */}
                <button
                  onClick={handleAddToCart}
                  className="btn-primary flex-1 min-h-[44px] min-w-0 px-3 py-2.5 flex items-center justify-center gap-1.5 text-base font-semibold transition-all active:scale-95 hover:shadow-lg"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="w-5 h-5 stroke-[3] flex-shrink-0" />
                  <span className="truncate">{t('add')}</span>
                </button>
              </div>

              {/* Options Indicator */}
              {hasCustomizableOptions() && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  {t('customizable')}
                </p>
              )}
            </div>
          </div>
        )
      ) : (
        // List View - Enhanced User-Friendly Design
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-row h-52 w-full">
          {/* Item Image - Larger and more prominent */}
          <div className="relative w-52 h-full overflow-hidden flex-shrink-0">
            <OptimizedImage
              src={getSafeImageUrl(item.image)}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
            {/* Category Badge */}
            <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {getCategoryDisplay(item.category)}
              </span>
            </div>
          </div>

          {/* Item Details - More spacious layout */}
          <div className="flex flex-col justify-between p-6 flex-grow min-w-0">
            {/* Top: Title, Description and Price */}
            <div className="flex-grow">
              <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
                  {item.name || 'Unnamed Item'}
                </h3>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                  {formatPrice(item.price)}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed line-clamp-2">
                {item.description || 'No description available'}
              </p>
              {/* Options Indicator */}
              {hasCustomizableOptions() && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                  ✨ {t('customizable')}
                </p>
              )}
            </div>

            {/* Bottom: Controls - Larger and more prominent */}
            <div className="flex items-center gap-4 w-full mt-auto">
              {/* Quantity Controls - Larger buttons */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-2xl px-2 py-1.5 flex-shrink-0 shadow-inner">
                <button
                  onClick={decrementQuantity}
                  className="min-w-[52px] min-h-[52px] w-13 h-13 rounded-xl bg-white dark:bg-gray-600 hover:bg-primary-50 dark:hover:bg-gray-500 active:scale-95 flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-6 h-6 text-gray-700 dark:text-gray-300 stroke-[3]" />
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100 w-10 text-center">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="min-w-[52px] min-h-[52px] w-13 h-13 rounded-xl bg-white dark:bg-gray-600 hover:bg-primary-50 dark:hover:bg-gray-500 active:scale-95 flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-6 h-6 text-gray-700 dark:text-gray-300 stroke-[3]" />
                </button>
              </div>

              {/* Add Button - Larger and more prominent */}
              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 min-h-[56px] min-w-0 px-8 py-4 flex items-center justify-center gap-3 text-xl font-bold transition-all active:scale-95 hover:shadow-xl rounded-2xl"
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="w-6 h-6 stroke-[3] flex-shrink-0" />
                <span className="truncate">{t('add')}</span>
              </button>
            </div>

            {/* Options Indicator */}
            {hasCustomizableOptions() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('customizable')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Options Modal */}
      {showOptionsModal && (
        <ItemOptionsModal
          item={item}
          initialQuantity={quantity}
          onClose={() => {
            setShowOptionsModal(false);
            setQuantity(1); // Reset quantity after closing modal
          }}
        />
      )}
    </>
  );
}