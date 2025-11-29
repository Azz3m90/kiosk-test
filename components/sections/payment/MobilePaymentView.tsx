'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Smartphone } from 'lucide-react';

export function MobilePaymentView() {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700">
      <Smartphone className="w-24 h-24 text-primary-500 dark:text-primary-400 mx-auto mb-6" />
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {t('scan_qr_code')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg font-medium">{t('mobile_payment_instructions')}</p>
      <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mx-auto flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('qr_code_placeholder')}</p>
      </div>
    </div>
  );
}