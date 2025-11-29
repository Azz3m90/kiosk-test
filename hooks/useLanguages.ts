'use client';

import { useState, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface LanguagesData {
  restaurant_ref: string;
  restaurant_name: string;
  languages: Language[];
  default_language: {
    code: string;
    name: string;
  };
  available_count: number;
}

interface UseLanguagesOptions {
  restaurant?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch languages from the dedicated restaurant languages endpoint
 * GET /api/restaurants/{ref}/languages
 * 
 * Returns:
 * - languages: array of available languages with metadata
 * - default_language: the restaurant's default language
 * - defaultLanguageCode: convenience accessor for default language code
 */
export function useLanguages(options: UseLanguagesOptions = {}) {
  const { restaurant = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Test-FastCaisse') : 'Test-FastCaisse', enabled = true } = options;

  const [data, setData] = useState<LanguagesData | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      console.log('🔌 useLanguages: Disabled for', restaurant);
      return;
    }

    const fetchLanguages = async () => {
      try {
        console.log('🚀 useLanguages: Starting fetch for restaurant:', restaurant);
        setIsLoading(true);
        setError(null);

        // Try to load from cache first
        const cacheKey = `languages_${restaurant}`;
        const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
        
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            console.log('✅ useLanguages: Loaded from cache for restaurant:', restaurant, cachedData);
            setData(cachedData);
            setIsLoading(false);
            return;
          } catch (e) {
            console.warn('⚠️ useLanguages: Failed to parse cached data, will fetch fresh');
          }
        }

        const url = `/api/languages?restaurant=${encodeURIComponent(restaurant)}`;
        console.log('📡 useLanguages: Fetching from URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        console.log('📥 useLanguages: Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Provide specific error message for common HTTP status codes
          let errorMsg = errorData.error || `HTTP error! status: ${response.status}`;
          
          if (response.status === 404) {
            errorMsg = `Restaurant "${restaurant}" not found. Please check the name and try again.`;
          } else if (response.status === 400) {
            errorMsg = errorData.error || 'Invalid restaurant name. Please try again.';
          }
          
          console.error('❌ useLanguages: HTTP Error:', errorMsg);
          throw new Error(errorMsg);
        }

        const languagesData = await response.json();
        console.log('✅ useLanguages: Data received:', languagesData);
        
        // Save to localStorage for persistence across page reloads
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(languagesData.data));
          console.log('💾 useLanguages: Saved to cache:', cacheKey);
        }
        
        setData(languagesData.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch languages';
        console.error(`❌ useLanguages: Error fetching languages: ${errorMessage}`);
        setError(errorMessage);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, [restaurant, enabled]);

  return {
    data,
    languages: data?.languages || [],
    defaultLanguage: data?.default_language,
    defaultLanguageCode: data?.default_language?.code || 'en',
    isLoading,
    error,
    isSuccess: data !== null && !error,
  };
}