'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { CreditCard } from 'lucide-react';

export function BancontactView() {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg p-8 border border-blue-200 dark:border-blue-800">
      <div className="text-center">
        <CreditCard className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Bancontact</h4>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('secure_payment_processing')}
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('payment_will_be_processed_securely')}
          </p>
        </div>
      </div>
    </div>
  );
}
