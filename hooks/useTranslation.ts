'use client';

import { useKiosk } from '@/context/KioskContext';
import { restaurantData } from '@/data/restaurant-data';

export function useTranslation() {
  const { currentLanguage } = useKiosk();

  const t = (key: string): string => {
    const translations = restaurantData.translations[currentLanguage];
    return translations?.[key] || restaurantData.translations.en[key] || key;
  };

  return { t, currentLanguage };
}