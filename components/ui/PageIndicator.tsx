'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { Step } from '@/types';
import { UtensilsCrossed, ClipboardCheck, CreditCard } from 'lucide-react';

const stepOrder: Step[] = ['menu', 'review', 'payment'];

type NavigableStep = 'menu' | 'review' | 'payment';

const stepIcons: Record<NavigableStep, typeof UtensilsCrossed> = {
  menu: UtensilsCrossed,
  review: ClipboardCheck,
  payment: CreditCard,
};

const stepTranslationKeys: Record<NavigableStep, string> = {
  menu: 'menu_title',
  review: 'review_order',
  payment: 'payment',
};

export function PageIndicator() {
  const { currentStep, navigateToStep, cart, showToast } = useKiosk();
  const { t } = useTranslation();

  const currentIndex = stepOrder.indexOf(currentStep);

  const handleStepClick = (step: Step) => {
    // Check if trying to navigate to review/payment with empty cart
    if ((step === 'review' || step === 'payment') && cart.length === 0) {
      showToast(t('cart_empty_warning'), 'warning');
      return;
    }
    navigateToStep(step);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
      {stepOrder.map((step, index) => {
        const Icon = stepIcons[step as NavigableStep];
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;
        const translationKey = stepTranslationKeys[step as NavigableStep];

        return (
          <button
            key={step}
            onClick={() => handleStepClick(step)}
            className={`
              relative flex items-center justify-center transition-all duration-300 touch-manipulation
              ${isActive 
                ? 'w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full scale-110 shadow-lg' 
                : 'w-12 h-12 rounded-full hover:scale-110 active:scale-105'
              }
              ${isPast && !isActive
                ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                : !isActive && 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
            style={isActive ? {
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
            } : undefined}
            title={t(translationKey)}
            aria-label={t(translationKey)}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon */}
            <Icon
              className={`
                transition-all duration-300
                ${isActive 
                  ? 'w-7 h-7 text-white drop-shadow' 
                  : 'w-6 h-6'
                }
                ${isPast && !isActive
                  ? 'text-green-600 dark:text-green-400'
                  : !isActive && 'text-gray-600 dark:text-gray-400'
                }
              `}
              strokeWidth={isActive ? 2.5 : 2}
            />

            {/* Checkmark for completed steps */}
            {isPast && !isActive && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}

      {/* Swipe hint text - Subtle */}
      <div className="ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          ← {t('swipe')} →
        </p>
      </div>
    </div>
  );
}