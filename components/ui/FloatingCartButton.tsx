'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice } from '@/lib/utils';
import { CartSidebar } from './CartSidebar';

export function FloatingCartButton() {
  const { cart, getOrderSummary } = useKiosk();
  const { t } = useTranslation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBackToTopVisible, setIsBackToTopVisible] = useState(false);
  const summary = getOrderSummary();
  const itemCount = cart.length;

  // Detect when Back to Top button is visible (scroll > 300px)
  useEffect(() => {
    const handleScroll = () => {
      setIsBackToTopVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Floating Cart Button - Stacked above Back to Top */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={`
          fixed right-20 lg:right-24 z-30
          flex flex-col items-center justify-center
          w-20 h-20 lg:w-24 lg:h-24
          rounded-full shadow-2xl
          transition-all duration-300 ease-out
          touch-manipulation
          ${
            isBackToTopVisible 
              ? itemCount > 0 
                ? 'bottom-44 lg:bottom-48'  // With price label - more spacing
                : 'bottom-32 lg:bottom-36'  // No price label - less spacing
              : 'bottom-8'                   // Back to top hidden
          }
          ${
            itemCount > 0
              ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-110 animate-pulse-slow'
              : 'bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 hover:scale-105'
          }
        `}
        aria-label={`View cart with ${itemCount} items`}
        title={t('viewCart')}
      >
        {/* Cart Icon */}
        <ShoppingCart className="w-8 h-8 lg:w-10 lg:h-10 text-white drop-shadow-md" strokeWidth={2.5} />
        
        {/* Item Count Badge */}
        {itemCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800 animate-bounce-subtle">
            <span className="text-base lg:text-lg font-black">{itemCount}</span>
          </div>
        )}
        
        {/* Total Price Label */}
        {itemCount > 0 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg border-2 border-green-500 dark:border-green-400 whitespace-nowrap">
            <span className="text-sm lg:text-base font-bold text-green-700 dark:text-green-300">
              {formatPrice(summary.total)}
            </span>
          </div>
        )}
      </button>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}