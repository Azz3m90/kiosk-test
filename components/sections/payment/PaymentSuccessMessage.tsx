'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { CheckCircle } from 'lucide-react';

export function PaymentSuccessMessage() {
  const { t } = useTranslation();

  return (
    <section className="animate-fade-in">
      <div className="text-center py-20">
        <CheckCircle className="w-32 h-32 text-green-500 dark:text-green-400 mx-auto mb-6 animate-scale-in" />
        <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('payment_success')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-xl font-medium">{t('payment_success_message')}</p>
      </div>
    </section>
  );
}