'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Smartphone } from 'lucide-react';

export function CCVView() {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg p-8 border border-purple-200 dark:border-purple-800">
      <div className="text-center">
        <Smartphone className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">CCV</h4>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('mobile_payment_method')}
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('payment_will_be_processed_via_mobile')}
          </p>
        </div>
      </div>
    </div>
  );
}
