'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useMenuData } from '@/hooks/useMenuData';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DiningMethodToggle } from '@/components/ui/DiningMethodToggle';
import { FlagIcons } from '@/components/ui/FlagIcons';
import { ChevronLeft, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { getSafeImageUrl } from '@/lib/utils';
import type { Language } from '@/types';
import { useMemo } from 'react';

// Language metadata mapping
const languageMetadata: Record<Language, { name: string; label: string }> = {
  en: { name: 'English', label: 'EN' },
  fr: { name: 'Français', label: 'FR' },
  nl: { name: 'Nederlands', label: 'NL' },
  de: { name: 'Deutsch', label: 'DE' },
  es: { name: 'Español', label: 'ES' },
  it: { name: 'Italiano', label: 'IT' },
};

export function Header() {
  const { changeLanguage, currentLanguage, orderType, navigateToStep, availableLanguages, defaultRestaurantLanguage, restaurantLogo, restaurantName } = useKiosk();
  const { t } = useTranslation();
  const { languages: apiLanguages, defaultLanguage } = useMenuData();

  // Use all available system languages
  const allAvailableLanguages = Object.keys(languageMetadata) as Language[];

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🎯 Header - currentLanguage:', currentLanguage);
    console.log('🎯 Header - defaultRestaurantLanguage:', defaultRestaurantLanguage);
    console.log('🎯 Header - allAvailableLanguages:', allAvailableLanguages);
    console.log('🎯 Header - restaurantName:', restaurantName);
    console.log('🎯 Header - restaurantLogo (raw):', restaurantLogo);
    console.log('🎯 Header - restaurantLogo.header (raw):', restaurantLogo?.header);
    console.log('🎯 Header - restaurantLogo.header (safe):', getSafeImageUrl(restaurantLogo?.header));
    console.log('🎯 Header - Will show logo?', getSafeImageUrl(restaurantLogo?.header) && getSafeImageUrl(restaurantLogo?.header) !== '/assets/placeholder.svg');
  }

  // Build language options from all available languages
  const languages = useMemo(
    () =>
      allAvailableLanguages.map((code) => ({
        code: code as Language,
        name: languageMetadata[code as Language]?.name || code,
        label: languageMetadata[code as Language]?.label || code.toUpperCase(),
      })),
    [allAvailableLanguages]
  );

  const handleBack = () => {
    navigateToStep('orderType');
  };

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-primary-500 to-secondary-500 dark:from-gray-800 dark:to-gray-900 px-4 lg:px-6 py-3 shadow-lg transition-colors duration-300">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Back Button, Logo, Title & Order Type */}
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-white/90 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
            title={t('back')}
            aria-label={t('back')}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-sm font-medium hidden sm:inline">{t('back')}</span>
          </button>
          

          
          <h1 className="text-xl lg:text-2xl font-bold text-white drop-shadow-md">
            {restaurantName || t('welcome')}
          </h1>
          
          {/* Order Type Badge - Compact */}
          {orderType && (
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
              {orderType === 'eatin' ? (
                <>
                  <UtensilsCrossed className="w-4 h-4 text-green-600 dark:text-emerald-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-green-700 dark:text-emerald-300 hidden sm:inline">
                    {t('eat_in')}
                  </span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-orange-600 dark:text-orange-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-orange-700 dark:text-orange-300 hidden sm:inline">
                    {t('take_away')}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Dining Method Toggle */}
          <DiningMethodToggle />
        </div>

        {/* Right: Controls - Compact Layout */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle - Compact */}
          <ThemeToggle />

          {/* Language Selector - Compact & Horizontal (Only show if languages are available) */}
          {languages.length > 0 && (
            <div className="flex gap-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-1.5 rounded-xl shadow-lg">
              {languages.map(({ code, name, label }) => {
                const FlagIcon = FlagIcons[code];
                return (
                  <button
                    key={code}
                    onClick={() => changeLanguage(code)}
                    className={`
                      relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 
                      min-w-[50px] touch-manipulation
                      ${
                        currentLanguage === code
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-md scale-105 ring-2 ring-primary-300 dark:ring-primary-600'
                          : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                      }
                    `}
                    title={name}
                    aria-label={`Switch to ${name}`}
                    aria-pressed={currentLanguage === code}
                  >
                    {/* Flag Icon - Smaller */}
                    <FlagIcon 
                      width={28} 
                      height={21} 
                      className={`
                        filter drop-shadow-sm transition-all duration-200 mb-0.5
                        ${currentLanguage === code ? 'brightness-110' : 'opacity-80'}
                      `}
                    />
                    
                    {/* Language Code - Smaller */}
                    <span className={`
                      text-[9px] font-bold tracking-wide
                      ${
                        currentLanguage === code 
                          ? 'text-white' 
                          : 'text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}