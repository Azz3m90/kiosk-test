'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RestaurantLogo {
  header: string | null;
  footer: string | null;
}

export interface RestaurantConfig {
  name: string;
  description: string;
  ref: string;
  logo: RestaurantLogo;
  media: Record<string, any>;
  settings: Record<string, any>;
  languages: any[];
  defaultLanguage: string;
  status: Record<string, any>;
}

interface UseRestaurantConfigReturn {
  config: RestaurantConfig | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CONFIG_CACHE_KEY = 'restaurant_config_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch and cache restaurant configuration from API
 * Includes name, logo, and other restaurant settings
 * 
 * @param restaurantName - Restaurant name (if not provided, will try to read from localStorage)
 * @returns Restaurant config, loading state, error, and refresh function
 */
export function useRestaurantConfig(restaurantName?: string, enabled: boolean = true): UseRestaurantConfigReturn {
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const configState = error ? 'error' : isLoading ? 'loading' : config ? 'success' : 'pending';

  // Get restaurant name from prop or localStorage
  const getRestaurantName = useCallback(() => {
    if (restaurantName) return restaurantName;
    
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('kiosk_restaurant_name');
  }, [restaurantName]);

  // Check if cached config is still valid
  const getCachedConfig = useCallback(() => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(CONFIG_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Return cache if still valid
      if (now - timestamp < CACHE_DURATION) {
        console.log('✅ useRestaurantConfig: Using cached configuration');
        return data;
      }

      // Clear expired cache
      localStorage.removeItem(CONFIG_CACHE_KEY);
      return null;
    } catch (e) {
      console.warn('⚠️ useRestaurantConfig: Failed to parse cached config');
      return null;
    }
  }, []);

  // Fetch restaurant configuration from API
  const fetchConfig = useCallback(async () => {
    const name = getRestaurantName();
    
    if (!name) {
      setIsLoading(false);
      setConfig(null);
      setError('Restaurant name not configured');
      return;
    }

    // Try to use cache first
    const cachedConfig = getCachedConfig();
    if (cachedConfig) {
      setConfig(cachedConfig);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/config?restaurant=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch configuration');
      }

      setConfig(data.data);

      // Cache the configuration
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            CONFIG_CACHE_KEY,
            JSON.stringify({
              data: data.data,
              timestamp: Date.now()
            })
          );
          console.log('💾 useRestaurantConfig: Configuration cached');
        } catch (e) {
          console.warn('⚠️ useRestaurantConfig: Failed to cache configuration');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch configuration';
      console.error('❌ useRestaurantConfig:', errorMessage);
      setError(errorMessage);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [getRestaurantName, getCachedConfig]);

  // Initial fetch on mount
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      setConfig(null);
      return;
    }
    fetchConfig();
  }, [fetchConfig, enabled]);

  // Expose refresh function to manually refetch
  const refresh = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONFIG_CACHE_KEY);
    }
    await fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    error,
    refresh,
  };
}