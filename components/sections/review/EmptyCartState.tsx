'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ShoppingBag } from 'lucide-react';

export function EmptyCartState() {
  const { navigateToStep } = useKiosk();
  const { t } = useTranslation();

  return (
    <section className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 animate-fade-in">
      <div className="text-center px-8 max-w-2xl">
        <ShoppingBag className="w-40 h-40 text-gray-300 dark:text-gray-600 mx-auto mb-8" />
        <h2 className="text-6xl font-bold text-gray-800 dark:text-white mb-6">
          {t('cart_empty')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-3xl mb-12">
          {t('cart_empty_message')}
        </p>
        <button
          onClick={() => navigateToStep('menu')}
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-16 py-8 rounded-2xl text-3xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 min-w-[320px]"
        >
          {t('start_ordering')}
        </button>
      </div>
    </section>
  );
}