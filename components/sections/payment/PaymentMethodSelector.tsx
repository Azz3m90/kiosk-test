'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useKiosk } from '@/context/KioskContext';
import { CreditCard, Smartphone, Banknote, Wallet, Store, CheckCircle2 } from 'lucide-react';
import type { PaymentMethod } from '@/types';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  banknote: <Banknote className="w-12 h-12" />,
  creditcard: <CreditCard className="w-12 h-12" />,
  bancontact: <CreditCard className="w-12 h-12" />,
  wallet: <Wallet className="w-12 h-12" />,
  smartphone: <Smartphone className="w-12 h-12" />,
  store: <Store className="w-12 h-12" />,
};

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const { availablePaymentMethods } = useKiosk();

  const enabledMethods = Object.entries(availablePaymentMethods)
    .filter(([_, method]) => method.enabled)
    .map(([key, method]) => ({ key: key as PaymentMethod, ...method }))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (enabledMethods.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border-2 border-red-200 dark:border-red-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 dark:text-red-400 text-lg">⚠</span>
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold">{t('no_payment_methods_available')}</p>
        </div>
      </div>
    );
  }

  const gridCols = enabledMethods.length === 1 
    ? 'grid-cols-1'
    : enabledMethods.length === 2
    ? 'md:grid-cols-2'
    : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 mb-6 border border-gray-100 dark:border-gray-700">
      {/* Header Section */}
      <div className="mb-8">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('select_payment_method')}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          <span className="font-medium">{enabledMethods.length}</span> {enabledMethods.length === 1 ? 'method available' : 'methods available'}
        </p>
      </div>

      {/* Payment Methods Grid */}
      <div className={`grid grid-cols-1 ${gridCols} gap-4 sm:gap-6 mb-8`}>
        {enabledMethods.map((method) => {
          const isSelected = selectedMethod === method.key;

          return (
            <button
              key={method.key}
              onClick={() => onMethodChange(method.key)}
              className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all min-h-[140px] sm:min-h-[180px] active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group ${
                isSelected
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/20 dark:to-primary-600/20 dark:border-primary-400 scale-105 shadow-xl focus:ring-primary-300 dark:focus:ring-primary-600'
                  : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 bg-white dark:bg-gray-700 hover:shadow-md hover:-translate-y-1 focus:ring-primary-200 dark:focus:ring-primary-700'
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${method.title} payment method`}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 animate-scale-in">
                  <div className="flex items-center justify-center bg-primary-500 dark:bg-primary-400 rounded-full p-1">
                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex flex-col items-center h-full justify-center">
                {/* Icon Container */}
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 flex items-center justify-center rounded-full transition-all ${
                    isSelected
                      ? 'bg-primary-200 dark:bg-primary-500/40 text-primary-600 dark:text-primary-300 shadow-md'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 group-hover:text-primary-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                  }`}
                >
                  {iconMap[method.icon] || <Banknote className="w-6 h-6 sm:w-8 sm:h-8" />}
                </div>

                {/* Title */}
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 text-center leading-tight">
                  {method.title}
                </p>

                {/* Description */}
                {method.content && method.content.trim() && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 text-center leading-snug line-clamp-2 max-w-xs">
                    {method.content.replace(/<[^>]*>/g, '')}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tip Section */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">💳</span>
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Payment Secured:</span> Your selected payment method is secure and encrypted. You can change your selection at any time before confirming.
          </p>
        </div>
      </div>
    </div>
  );
}