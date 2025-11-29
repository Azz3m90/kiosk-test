'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { EmptyCartState } from './review/EmptyCartState';
import { CartItemCard } from './review/CartItemCard';
import { OrderSummaryPanel } from './review/OrderSummaryPanel';
import type { CartItem } from '@/types';
import { useMemo } from 'react';

// Helper function to check if two cart items are identical (same item, options, instructions)
function areCartItemsIdentical(item1: CartItem, item2: CartItem): boolean {
  // Must be the same menu item
  if (item1.menuItemId !== item2.menuItemId) return false;

  // Compare special instructions (normalize empty values and case-insensitive)
  const instructions1 = (item1.specialInstructions || '').trim().toLowerCase();
  const instructions2 = (item2.specialInstructions || '').trim().toLowerCase();
  if (instructions1 !== instructions2) return false;

  // Compare selected options
  const options1 = item1.selectedOptions || [];
  const options2 = item2.selectedOptions || [];
  
  if (options1.length !== options2.length) return false;

  // Sort options by name for consistent comparison
  const sortedOptions1 = [...options1].sort((a, b) => a.optionName.localeCompare(b.optionName));
  const sortedOptions2 = [...options2].sort((a, b) => a.optionName.localeCompare(b.optionName));

  // Compare each option
  for (let i = 0; i < sortedOptions1.length; i++) {
    const opt1 = sortedOptions1[i];
    const opt2 = sortedOptions2[i];

    if (opt1.optionName.toLowerCase() !== opt2.optionName.toLowerCase()) return false;
    if (opt1.additionalPrice !== opt2.additionalPrice) return false;

    // Compare choices (sorted and case-insensitive) - handle both array and object formats
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

// Group cart items by identical configuration
interface GroupedCartItem {
  representativeItem: CartItem; // The item to display
  totalQuantity: number; // Combined quantity
  cartItemIds: string[]; // All cart item IDs in this group
}

export function ReviewSection() {
  const { cart } = useKiosk();
  const { t } = useTranslation();

  // Group identical cart items
  const groupedItems = useMemo<GroupedCartItem[]>(() => {
    const groups: GroupedCartItem[] = [];

    cart.forEach((cartItem) => {
      // Find existing group with identical items
      const existingGroup = groups.find((group) => 
        areCartItemsIdentical(group.representativeItem, cartItem)
      );

      if (existingGroup) {
        // Add to existing group
        existingGroup.totalQuantity += cartItem.quantity;
        existingGroup.cartItemIds.push(cartItem.id);
      } else {
        // Create new group
        groups.push({
          representativeItem: cartItem,
          totalQuantity: cartItem.quantity,
          cartItemIds: [cartItem.id],
        });
      }
    });

    return groups;
  }, [cart]);

  // Empty cart state
  if (cart.length === 0) {
    return <EmptyCartState />;
  }

  // Split layout: Left (cart items) + Right (order summary)
  return (
    <section className="flex flex-col min-h-[calc(100vh-220px)] sm:min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-180px)] max-h-[calc(100vh-140px)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg animate-fade-in pb-16 sm:pb-20 lg:pb-24">
      {/* Section Header - Centered */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-t-2xl flex-shrink-0">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-white text-center">
          {t('review_order')}
        </h2>
      </div>

      {/* Content Area - Split Layout - Scrollable */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* LEFT PANEL - Cart Items (Scrollable) */}
        <div className="flex-1 p-2 sm:p-3 lg:p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-2">
            {groupedItems.map((group, index) => (
              <CartItemCard 
                key={group.cartItemIds.join('-')} 
                cartItem={{
                  ...group.representativeItem,
                  quantity: group.totalQuantity,
                }}
                groupedCartItemIds={group.cartItemIds}
              />
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - Order Summary (Fixed on Desktop) */}
        <div className="lg:w-80 xl:w-96 lg:border-l lg:border-gray-200 lg:dark:border-gray-700 flex-shrink-0">
          <div className="h-full p-2 sm:p-3 lg:p-4">
            <OrderSummaryPanel />
          </div>
        </div>
      </div>
    </section>
  );
}