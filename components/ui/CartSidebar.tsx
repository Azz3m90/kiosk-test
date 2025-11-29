'use client';

import { useState, useEffect, useMemo } from 'react';
import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice } from '@/lib/utils';
import { useMenuData } from '@/hooks/useMenuData';
import { ShoppingCart, Trash2, X, Edit2 } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { getSafeImageUrl } from '@/lib/utils';
import { ConfirmDialog } from './ConfirmDialog';
import { ItemOptionsModal } from './ItemOptionsModal';
import type { CartItem, MenuItem } from '@/types';

// Helper function to check if two cart items are identical
function areCartItemsIdentical(item1: CartItem, item2: CartItem): boolean {
  if (item1.menuItemId !== item2.menuItemId) return false;

  const instructions1 = (item1.specialInstructions || '').trim().toLowerCase();
  const instructions2 = (item2.specialInstructions || '').trim().toLowerCase();
  if (instructions1 !== instructions2) return false;

  const options1 = item1.selectedOptions || [];
  const options2 = item2.selectedOptions || [];
  
  if (options1.length !== options2.length) return false;

  const sortedOptions1 = [...options1].sort((a, b) => a.optionName.localeCompare(b.optionName));
  const sortedOptions2 = [...options2].sort((a, b) => a.optionName.localeCompare(b.optionName));

  for (let i = 0; i < sortedOptions1.length; i++) {
    const opt1 = sortedOptions1[i];
    const opt2 = sortedOptions2[i];

    if (opt1.optionName.toLowerCase() !== opt2.optionName.toLowerCase()) return false;
    if (opt1.additionalPrice !== opt2.additionalPrice) return false;

    // Handle both array and object (Record) formats for choices
    const choices1Str = Array.isArray(opt1.choices)
      ? opt1.choices.map(c => c.toLowerCase()).sort().join('|')
      : Object.entries(opt1.choices).map(([name, qty]) => `${qty}x${name.toLowerCase()}`).sort().join('|');
    
    const choices2Str = Array.isArray(opt2.choices)
      ? opt2.choices.map(c => c.toLowerCase()).sort().join('|')
      : Object.entries(opt2.choices).map(([name, qty]) => `${qty}x${name.toLowerCase()}`).sort().join('|');
    
    if (choices1Str !== choices2Str) return false;
  }

  return true;
}

interface GroupedCartItem {
  representativeItem: CartItem;
  totalQuantity: number;
  cartItemIds: string[];
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cart, removeFromCart, getOrderSummary, navigateToStep, updateQuantity, restaurantName } = useKiosk();
  const { t } = useTranslation();
  const { items: menuItems, isLoading: menuLoading } = useMenuData({ restaurant: restaurantName || undefined });
  const [itemToRemove, setItemToRemove] = useState<string[] | null>(null); // Now supports multiple IDs
  const [itemToEdit, setItemToEdit] = useState<{ cartItem: CartItem; menuItem: MenuItem } | null>(null);

  console.log('🛒 CartSidebar - Restaurant:', restaurantName, 'Menu items loaded:', menuItems.length, 'Loading:', menuLoading);

  const orderSummary = getOrderSummary();
  
  // Calculate total quantity
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Group identical cart items
  const groupedItems = useMemo<GroupedCartItem[]>(() => {
    const groups: GroupedCartItem[] = [];

    cart.forEach((cartItem) => {
      const existingGroup = groups.find((group) => 
        areCartItemsIdentical(group.representativeItem, cartItem)
      );

      if (existingGroup) {
        existingGroup.totalQuantity += cartItem.quantity;
        existingGroup.cartItemIds.push(cartItem.id);
      } else {
        groups.push({
          representativeItem: cartItem,
          totalQuantity: cartItem.quantity,
          cartItemIds: [cartItem.id],
        });
      }
    });

    return groups;
  }, [cart]);

  // Function to get menu item from API data
  const getMenuItem = (menuItemId: number): MenuItem | undefined => {
    const found = menuItems.find(item => item.id === menuItemId || item.id === Number(menuItemId));
    if (!found) {
      console.log('🔍 Available menu item IDs:', menuItems.map(item => ({ id: item.id, name: item.name, type: typeof item.id })));
      console.log('🔍 Looking for menuItemId:', menuItemId, 'Type:', typeof menuItemId);
    }
    return found;
  };

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      // Save original overflow style
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Lock scroll and compensate for scrollbar
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Cleanup: restore scroll when sidebar closes
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  const handleCheckout = () => {
    navigateToStep('review');
    onClose();
  };

  const handleRemoveClick = (cartItemIds: string[]) => {
    setItemToRemove(cartItemIds);
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      itemToRemove.forEach(id => removeFromCart(id));
      setItemToRemove(null);
    }
  };

  const handleEditClick = (group: GroupedCartItem) => {
    // Only allow editing single items (not grouped)
    if (group.cartItemIds.length > 1) {
      alert('Cannot edit grouped items. Please remove and add again with desired options.');
      return;
    }
    
    const cartItem = group.representativeItem;
    const menuItem = getMenuItem(cartItem.menuItemId);
    console.log('🔍 Edit clicked - menuItemId:', cartItem.menuItemId, 'menuItem found:', !!menuItem, 'total menuItems:', menuItems.length);
    if (menuItem) {
      setItemToEdit({ cartItem, menuItem });
    } else {
      console.error('❌ Menu item not found for ID:', cartItem.menuItemId);
      alert('Unable to edit this item. Menu item not found.');
    }
  };

  const handleQuantityChange = (group: GroupedCartItem, change: number) => {
    const isGrouped = group.cartItemIds.length > 1;

    if (isGrouped) {
      const firstItemId = group.cartItemIds[0];
      const firstItem = cart.find((item) => item.id === firstItemId);

      if (change > 0) {
        // Increase: Add to first item's quantity
        if (firstItem) {
          updateQuantity(firstItemId, firstItem.quantity + 1);
        }
      } else {
        // Decrease: Remove one from the total
        if (group.cartItemIds.length > 1) {
          // Remove the last cart entry
          removeFromCart(group.cartItemIds[group.cartItemIds.length - 1]);
        } else if (firstItem && firstItem.quantity > 1) {
          // Decrease quantity of the single item
          updateQuantity(firstItemId, firstItem.quantity - 1);
        }
      }
    } else {
      // Single item: update quantity directly
      const cartItem = group.representativeItem;
      const newQuantity = cartItem.quantity + change;
      if (newQuantity > 0) {
        updateQuantity(cartItem.id, newQuantity);
      }
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Slides from RIGHT */}
      <div
        className={`fixed top-0 right-0 h-screen w-[520px] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t('your_cart')}
              </h2>
              <p className="text-white/80 text-sm font-medium">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-14 h-14 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-110"
            aria-label="Close cart"
          >
            <X className="w-8 h-8 text-white" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t('cart_empty')}</p>
              <button
                onClick={onClose}
                className="mt-6 px-8 py-4 bg-primary-500 text-white rounded-xl text-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                {t('continue_shopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group) => {
                const isGrouped = group.cartItemIds.length > 1;
                const cartItem = {
                  ...group.representativeItem,
                  quantity: group.totalQuantity,
                };

                return (
                  <div
                    key={group.cartItemIds.join('-')}
                    className={`rounded-xl p-5 flex gap-4 transition-colors ${
                      isGrouped
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {/* Item Image */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <OptimizedImage
                        src={getSafeImageUrl(cartItem.image)}
                        alt={cartItem.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate">
                          {cartItem.name}
                        </h3>
                        {isGrouped && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                            GROUPED
                          </span>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 my-2">
                        <button
                          onClick={() => handleQuantityChange(group, -1)}
                          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-200 font-bold">−</span>
                        </button>
                        <span className="text-base font-bold text-gray-700 dark:text-gray-200 min-w-[40px] text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(group, +1)}
                          className="w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center transition-colors"
                        >
                          <span className="text-white font-bold">+</span>
                        </button>
                      </div>

                      {cartItem.selectedOptions &&
                        cartItem.selectedOptions.length > 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {cartItem.selectedOptions
                              .map((opt) => opt.optionName)
                              .join(', ')}
                          </p>
                        )}
                      {cartItem.specialInstructions && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 italic mt-1 line-clamp-2">
                          ✏️ {cartItem.specialInstructions}
                        </p>
                      )}
                      <p className="text-primary-600 dark:text-primary-400 font-bold text-xl mt-2">
                        {formatPrice(cartItem.finalPrice * cartItem.quantity)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(group)}
                        disabled={isGrouped}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          isGrouped
                            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                        }`}
                        aria-label="Edit item"
                        title={isGrouped ? 'Cannot edit grouped items' : 'Edit item'}
                      >
                        <Edit2 className={`w-6 h-6 ${
                          isGrouped ? 'text-gray-500' : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </button>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveClick(group.cartItemIds)}
                        className="w-12 h-12 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl flex items-center justify-center transition-colors"
                        aria-label="Remove item"
                        title={isGrouped ? 'Remove all identical items' : 'Remove item'}
                      >
                        <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

        {/* Edit Item Modal */}
        {itemToEdit && (
          <ItemOptionsModal
            item={itemToEdit.menuItem}
            cartItemToEdit={itemToEdit.cartItem}
            onClose={() => setItemToEdit(null)}
          />
        )}

        {/* Footer - Compact */}
        {cart.length > 0 && (
          <div className="border-t-2 border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex-shrink-0">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>{t('total')}:</span>
                <span className="text-primary-600 dark:text-primary-400 text-xl">
                  {formatPrice(orderSummary.total)}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-green-500 to-green-600 text-white text-base font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              {t('proceed_to_checkout')}
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-5 mt-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('continue_shopping')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}