'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Step } from '@/types';

interface NavigationButtonsProps {
  currentStep: Step;
  showNext?: boolean;
  showPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  nextDisabled?: boolean;
}

const stepOrder: Step[] = ['menu', 'review', 'payment'];

export function NavigationButtons({
  currentStep,
  showNext = true,
  showPrevious = true,
  onNext,
  onPrevious,
  nextLabel,
  previousLabel,
  nextDisabled = false,
}: NavigationButtonsProps) {
  const { navigateToStep, cart, showToast } = useKiosk();
  const { t } = useTranslation();

  const currentIndex = stepOrder.indexOf(currentStep);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < stepOrder.length - 1;

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else if (hasPrevious) {
      const previousStep = stepOrder[currentIndex - 1];
      navigateToStep(previousStep);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (hasNext) {
      const nextStep = stepOrder[currentIndex + 1];
      
      // Check if trying to navigate to review/payment with empty cart
      if ((nextStep === 'review' || nextStep === 'payment') && cart.length === 0) {
        showToast(t('cart_empty_warning'), 'warning');
        return;
      }
      
      navigateToStep(nextStep);
    }
  };

  return (
    <div className="flex justify-start items-center gap-4 mt-8">
      {/* Previous Button - LARGER for better touch targets */}
      {showPrevious && hasPrevious && (
        <button
          onClick={handlePrevious}
          className="flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-lg sm:text-xl rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl touch-manipulation"
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>{previousLabel || t('previous')}</span>
        </button>
      )}

      {/* Next Button - LARGER for better touch targets */}
      {showNext && hasNext && (
        <button
          onClick={handleNext}
          disabled={nextDisabled}
          className="flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg sm:text-xl rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl touch-manipulation"
        >
          <span>{nextLabel || t('next')}</span>
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}