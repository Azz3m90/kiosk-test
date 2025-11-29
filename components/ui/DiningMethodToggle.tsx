'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { UtensilsCrossed, ShoppingBag } from 'lucide-react';
import type { DiningMethod } from '@/types';

export function DiningMethodToggle() {
  const { diningMethod, setDiningMethod, availableDiningMethods, showToast } = useKiosk();
  const { t } = useTranslation();

  // Get enabled dining methods
  const enabledMethods = Object.entries(availableDiningMethods)
    .filter(([_, method]) => method.enabled)
    .map(([key]) => key as DiningMethod);

  // Don't show if only one method or no methods
  if (enabledMethods.length <= 1) {
    return null;
  }

  const getIcon = (method: DiningMethod) => {
    switch (method) {
      case 'eatin':
        return <UtensilsCrossed className="w-5 h-5" strokeWidth={2.5} />;
      case 'pickup':
        return <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />;
    }
  };

  const getGradient = (method: DiningMethod) => {
    switch (method) {
      case 'eatin':
        return 'from-emerald-400 to-emerald-500';
      case 'pickup':
        return 'from-orange-400 to-orange-500';
    }
  };

  const getLabel = (method: DiningMethod) => {
    const methodInfo = availableDiningMethods[method];
    return methodInfo?.title || t(method);
  };

  const handleMethodChange = (method: DiningMethod) => {
    if (method === diningMethod) {
      return;
    }

    setDiningMethod(method);
    // Best practices: bottom-right position, 2.5s duration for quick feedback
    showToast(`✓ ${getLabel(method)}`, method as 'eatin' | 'pickup', 'bottom-right', 2500);
  };

  return (
    <div className="flex items-center gap-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-1.5 rounded-xl shadow-lg">
      {enabledMethods.map((method) => {
        const isActive = method === diningMethod;
        const gradient = getGradient(method);

        return (
          <button
            key={method}
            onClick={() => handleMethodChange(method)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 font-medium
              touch-manipulation active:scale-95
              ${
                isActive
                  ? `bg-gradient-to-r ${gradient} text-white shadow-md scale-105 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-current`
                  : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
              }
            `}
            title={getLabel(method)}
            aria-label={`Switch to ${getLabel(method)}`}
            aria-pressed={isActive}
          >
            <span>{getIcon(method)}</span>
            <span className="text-sm hidden sm:inline">{getLabel(method)}</span>
          </button>
        );
      })}
    </div>
  );
}