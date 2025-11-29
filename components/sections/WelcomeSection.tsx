'use client';

import { useKiosk } from '@/context/KioskContext';
import { useMenuData } from '@/hooks/useMenuData';
import { useRestaurantConfig } from '@/hooks/useRestaurantConfig';
import { Languages, CheckCircle2, Loader, AlertCircle } from 'lucide-react';
import { FlagIcons } from '@/components/ui/FlagIcons';
import { getSafeImageUrl } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import type { Language } from '@/types';
import { useMemo, useState } from 'react';

interface LanguageOption {
  code: Language;
  name: string;
}

// Language name mapping
const languageNames: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
};

export function WelcomeSection() {
  const { changeLanguage, navigateToStep, availableLanguages, defaultRestaurantLanguage, restaurantLogo, availableDiningMethods, showSetup, restaurantName, configLoading, configError, configLoaded } = useKiosk();
  const { data: menuData, languages: apiLanguages, defaultLanguage, isLoading: menuLoading, error: menuError } = useMenuData({ 
    restaurant: restaurantName,
    enabled: !showSetup 
  });
  const [logoProgress, setLogoProgress] = useState(0);
  
  const allDataLoaded = !menuLoading && !configLoading && menuData !== null && configLoaded;
  const isInitializing = menuLoading || configLoading;
  
  const menuSuccess = !menuLoading && !menuError && menuData !== null;
  const configSuccess = !configLoading && !configError && configLoaded;

  // Use all available system languages instead of restaurant configuration
  const allAvailableLanguages = Object.keys(languageNames) as Language[];
  const contextDefaultLanguage = availableLanguages.length > 0 ? defaultRestaurantLanguage : defaultLanguage;

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🎯 WelcomeSection - allAvailableLanguages:', allAvailableLanguages);
    console.log('🎯 WelcomeSection - contextDefaultLanguage:', contextDefaultLanguage);
    console.log('🎯 WelcomeSection - isInitializing:', isInitializing);
  }

  // Build language options from all available languages
  const languages = useMemo<LanguageOption[]>(
    () =>
      allAvailableLanguages.map((code) => ({
        code: code as Language,
        name: languageNames[code as Language] || code,
      })),
    [allAvailableLanguages]
  );

  const handleLanguageSelect = async (lang: Language) => {
    if (!allDataLoaded) return;
    
    // Enter fullscreen on first user interaction (kiosk mode)
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.log('Fullscreen not available:', error);
    }

    changeLanguage(lang);
    
    // Navigate to dining preference screen (now dynamic from API)
    navigateToStep('orderType');
  };



  // Show empty state if no languages are available
  if (languages.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 overflow-hidden">
        <div className="max-w-4xl w-full text-center">
          <div className="mb-6 animate-fade-in">
            <div className="mb-6 flex justify-center">
              {restaurantLogo?.header ? (
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <OptimizedImage 
                    src={getSafeImageUrl(restaurantLogo.header)}
                    alt="Restaurant Logo"
                    fill
                    className="object-contain drop-shadow-2xl rounded-lg opacity-60"
                    onProgress={setLogoProgress}
                  />

                </div>
              ) : (
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl animate-blink-icon relative z-10">
                    <Languages className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              No Languages Available
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Unable to load language options. Please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 overflow-hidden">
      <div className="max-w-4xl w-full">
        {/* Logo and Welcome Message */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="mb-4 flex justify-center">
            {restaurantLogo?.header ? (
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <OptimizedImage 
                  src={getSafeImageUrl(restaurantLogo.header)}
                  alt="Restaurant Logo"
                  fill
                  className="object-contain drop-shadow-2xl rounded-lg"
                  onError={() => {
                    console.warn('Restaurant logo failed to load');
                  }}
                  onProgress={setLogoProgress}
                />

              </div>
            ) : (
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-blink-icon relative z-10">
                  <Languages className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            Please select your language
          </p>
        </div>

        {/* Language Selection Cards */}
        <div className={`grid gap-3 md:gap-4 max-w-5xl mx-auto justify-items-center justify-center ${
          languages.length === 1
            ? 'grid-cols-1 md:grid-cols-1'
            : languages.length === 2
            ? 'grid-cols-2 md:grid-cols-2'
            : 'grid-cols-2 md:grid-cols-3'
        }`}>
          {languages.map((lang, index) => {
            const FlagIcon = FlagIcons[lang.code];
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={!allDataLoaded}
                className={`group relative overflow-hidden rounded-xl p-4 md:p-6 shadow-lg transition-all duration-300 transform border-2 w-[150px] ${
                  !allDataLoaded
                    ? 'opacity-50 grayscale cursor-not-allowed'
                    : 'hover:shadow-xl hover:scale-105 hover:-translate-y-1'
                } ${
                  contextDefaultLanguage === lang.code
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 dark:from-purple-600 dark:to-blue-500 border-blue-600 dark:border-purple-400 scale-105'
                    : 'bg-white dark:bg-gray-800 border-transparent hover:border-blue-500 dark:hover:border-purple-500'
                }`}
                style={{
                  animation: `slideUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Background Gradient Overlay */}
                {contextDefaultLanguage !== lang.code && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/10 group-hover:to-purple-600/10 transition-all duration-300" />
                )}
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Flag Icon */}
                  <div className="flex justify-center mb-3 md:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    <FlagIcon 
                      width={60} 
                      height={45} 
                      className={`filter drop-shadow-md rounded-md ${
                        contextDefaultLanguage === lang.code ? 'brightness-125' : ''
                      }`}
                    />
                  </div>
                  
                  {/* Language Name */}
                  <h2 className={`text-lg md:text-xl font-bold mb-1 transition-colors duration-300 ${
                    contextDefaultLanguage === lang.code
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-purple-400'
                  }`}>
                    {lang.name}
                  </h2>
                  
                  {/* Select Text */}
                  <p className={`text-xs transition-colors duration-300 ${
                    contextDefaultLanguage === lang.code
                      ? 'text-white/80'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`}>
                    {contextDefaultLanguage === lang.code ? '✓ Default' : 'Tap to select'}
                  </p>
                </div>

                {/* Hover Ring Effect */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/0 group-hover:ring-blue-500/50 dark:group-hover:ring-purple-500/50 transition-all duration-300" />
              </button>
            );
          })}
        </div>

        {/* Touch Anywhere Hint */}
        <div className="text-center mt-4 animate-pulse">
          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">
            Touch your preferred language to continue
          </p>
        </div>

        {/* Bottom Right Status Indicator */}
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={`transition-all duration-500 ${allDataLoaded ? 'scale-100' : 'scale-90'}`}>
              {isInitializing ? (
                <Loader className="w-6 h-6 text-blue-500 animate-spin" />
              ) : menuError || configError ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : allDataLoaded ? (
                <CheckCircle2 className="w-6 h-6 text-green-500 animate-pulse" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-400 border-r-transparent animate-spin" />
              )}
            </div>
            <span className={`font-semibold text-sm md:text-base transition-colors duration-500 ${
              allDataLoaded 
                ? 'text-green-600 dark:text-green-400' 
                : menuError || configError
                ? 'text-red-600 dark:text-red-400'
                : isInitializing
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isInitializing ? 'Initializing...' : menuError || configError ? 'Error' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes blink-icon {
            0%, 49% {
              opacity: 1;
            }
            50%, 100% {
              opacity: 0.5;
            }
          }

          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }

          .animate-blink-icon {
            animation: blink-icon 1s infinite;
          }
        `}
      </style>
    </div>
  );
}

export default WelcomeSection;