'use client';

import { useState } from 'react';
import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useMenuData } from '@/hooks/useMenuData';
import { formatPrice, getSafeImageUrl } from '@/lib/utils';
import { Trash2, Plus, Minus, CheckCircle, Edit2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ItemOptionsModal } from '@/components/ui/ItemOptionsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { CartItem, MenuItem } from '@/types';

interface CartItemCardProps {
  cartItem: CartItem;
  groupedCartItemIds?: string[]; // IDs of all items in this group
}

export function CartItemCard({ cartItem, groupedCartItemIds }: CartItemCardProps) {
  const { updateQuantity, removeFromCart, cart, restaurantName } = useKiosk();
  const { t } = useTranslation();
  const { items: menuItems, isLoading: menuLoading } = useMenuData({ restaurant: restaurantName || undefined });
  const [itemToEdit, setItemToEdit] = useState<{ cartItem: CartItem; menuItem: MenuItem } | null>(null);
  const [itemToRemove, setItemToRemove] = useState<string[] | null>(null);

  console.log('🎴 CartItemCard - Restaurant:', restaurantName, 'Menu items loaded:', menuItems.length, 'Loading:', menuLoading);

  // Check if this is a grouped display
  const isGrouped = groupedCartItemIds && groupedCartItemIds.length > 1;

  // Debug: Log cart item to console
  console.log('CartItemCard rendering:', cartItem, 'Grouped:', isGrouped);

  // Function to get menu item from API data
  const getMenuItem = (menuItemId: number): MenuItem | undefined => {
    const found = menuItems.find(item => item.id === menuItemId || item.id === Number(menuItemId));
    if (!found) {
      console.log('🔍 Available menu item IDs:', menuItems.map(item => ({ id: item.id, name: item.name, type: typeof item.id })));
      console.log('🔍 Looking for menuItemId:', menuItemId, 'Type:', typeof menuItemId);
    }
    return found;
  };

  const handleEditClick = () => {
    // For grouped items, edit is disabled (would affect all grouped items)
    if (isGrouped) {
      alert('Cannot edit grouped items. Please remove and add again with desired options.');
      return;
    }
    
    const menuItem = getMenuItem(cartItem.menuItemId);
    console.log('🔍 Edit clicked - menuItemId:', cartItem.menuItemId, 'menuItem found:', !!menuItem, 'total menuItems:', menuItems.length);
    if (menuItem) {
      setItemToEdit({ cartItem, menuItem });
    } else {
      console.error('❌ Menu item not found for ID:', cartItem.menuItemId);
      alert('Unable to edit this item. Menu item not found.');
    }
  };

  const handleRemoveClick = () => {
    if (isGrouped && groupedCartItemIds) {
      // Show confirmation for removing all grouped items
      setItemToRemove(groupedCartItemIds);
    } else {
      // Show confirmation for single item
      setItemToRemove([cartItem.id]);
    }
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      itemToRemove.forEach(id => removeFromCart(id));
      setItemToRemove(null);
    }
  };

  const handleQuantityChange = (change: number) => {
    if (isGrouped && groupedCartItemIds) {
      // For grouped items, we need to modify the actual cart items
      const firstItemId = groupedCartItemIds[0];
      
      // Get the actual first item from cart to know its real quantity
      const firstItem = cart.find(item => item.id === firstItemId);
      
      if (change > 0) {
        // Increase: Add 1 to the first item's actual quantity
        if (firstItem) {
          updateQuantity(firstItemId, firstItem.quantity + 1);
        }
      } else {
        // Decrease: Remove one from the total
        if (groupedCartItemIds.length > 1) {
          // Multiple items in group: remove the last one
          removeFromCart(groupedCartItemIds[groupedCartItemIds.length - 1]);
        } else if (firstItem) {
          // Single item with quantity > 1: decrease its quantity
          updateQuantity(firstItemId, Math.max(1, firstItem.quantity - 1));
        }
      }
    } else {
      // Single item - normal behavior
      const newQuantity = cartItem.quantity + change;
      updateQuantity(cartItem.id, newQuantity);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border ${
      isGrouped 
        ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-100 dark:ring-indigo-900/30' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Main Row: Image + Item Details + Price */}
      <div className="flex gap-3 mb-2">
        {/* Item Image */}
        <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md ring-2 ring-primary-200 dark:ring-primary-800">
          <OptimizedImage
            src={getSafeImageUrl(cartItem.image)}
            alt={cartItem.name}
            fill
            className="object-cover"
            sizes="80px"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm lg:text-base font-bold text-gray-800 dark:text-white truncate">
                {cartItem.name || 'Unnamed Item'}
              </h3>
              {isGrouped && (
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-full flex-shrink-0">
                  GROUPED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formatPrice(cartItem.finalPrice)} × {cartItem.quantity}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 self-start">
          <p className="text-base lg:text-lg font-bold text-gray-800 dark:text-white">
            {formatPrice(cartItem.finalPrice * cartItem.quantity)}
          </p>
        </div>
      </div>

      {/* Selected Options */}
      {cartItem.selectedOptions && cartItem.selectedOptions.length > 0 && (
        <div className="space-y-0.5 mb-2">
          {cartItem.selectedOptions.map((opt, idx) => {
            const pricePerItem = opt.additionalPrice / cartItem.quantity;
            return (
              <div
                key={idx}
                className="text-xs text-gray-600 dark:text-gray-400"
              >
                <span className="font-semibold">{opt.optionName}:</span>{' '}
                {Array.isArray(opt.choices) 
                  ? opt.choices.join(', ')
                  : Object.entries(opt.choices)
                      .map(([name, qty]) => `${qty}x ${name}`)
                      .join(', ')
                }
                {pricePerItem > 0 && (
                  <span className="text-primary-600 dark:text-primary-400 font-semibold ml-1">
                    +{formatPrice(pricePerItem)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Special Instructions */}
      {cartItem.specialInstructions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded border border-blue-200 dark:border-blue-800 mb-2">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <span className="font-bold">{t('note')}:</span>{' '}
            <span className="italic">{cartItem.specialInstructions}</span>
          </p>
        </div>
      )}

      {/* Controls Row: Quantity + Edit + Remove */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 flex items-center justify-center transition-all"
            aria-label="Decrease quantity"
          >
            <Minus className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-600 dark:text-indigo-400" />
          </button>
          <span className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white w-12 text-center">
            {cartItem.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(+1)}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center transition-all"
            aria-label="Increase quantity"
          >
            <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Edit Button - Disabled for grouped items */}
          <button
            onClick={handleEditClick}
            disabled={isGrouped}
            className={`px-3 py-2 lg:px-4 lg:py-2.5 rounded-full text-white text-sm lg:text-base font-semibold transition-all flex items-center gap-2 ${
              isGrouped 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            aria-label="Edit item"
            title={isGrouped ? 'Cannot edit grouped items' : 'Edit item'}
          >
            <Edit2 className="w-4 h-4 lg:w-5 lg:h-5" />
            Edit
          </button>

          {/* Remove Button */}
          <button
            onClick={handleRemoveClick}
            className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm lg:text-base font-semibold transition-all flex items-center gap-2"
            aria-label="Remove item"
            title={isGrouped ? 'Remove all identical items' : 'Remove item'}
          >
            <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
            Remove
          </button>
        </div>
      </div>

      {/* Edit Item Modal */}
      {itemToEdit && (
        <ItemOptionsModal
          item={itemToEdit.menuItem}
          cartItemToEdit={itemToEdit.cartItem}
          onClose={() => setItemToEdit(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={itemToRemove !== null}
        onClose={() => setItemToRemove(null)}
        onConfirm={confirmRemove}
        title={t('remove')}
        message="Are you sure you want to remove this item from your cart?"
        confirmText={t('remove')}
        cancelText={t('back')}
        variant="danger"
      />
    </div>
  );
}