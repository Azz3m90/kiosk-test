'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Store } from 'lucide-react';

export function CounterView() {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg p-8 border border-amber-200 dark:border-amber-800">
      <div className="text-center">
        <Store className="w-16 h-16 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('pay_at_counter')}
        </h4>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('complete_payment_at_counter')}
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('your_order_has_been_received')}
          </p>
        </div>
      </div>
    </div>
  );
}
