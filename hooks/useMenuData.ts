'use client';

import { useState, useEffect } from 'react';
import type { MenuItem } from '@/types';
import { sanitizeMenuData } from '@/lib/sanitize';

export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  imageUrl?: string | null;
  order?: number;
}

export interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
  totalItems: number;
  totalCategories: number;
  languages?: string[];
  defaultLanguage?: string;
}

interface UseMenuDataOptions {
  restaurant?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch menu data from Laravel backend via Next.js API
 * Includes filtering for hidden categories (show_in_page: 0)
 */
export function useMenuData(options: UseMenuDataOptions = {}) {
  const { restaurant, enabled = true } = options;
  
  const [data, setData] = useState<MenuData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const menuState = error ? 'error' : isLoading ? 'loading' : data ? 'success' : 'pending';

  if (restaurant) {
    console.log('🍽️ useMenuData - Using restaurant:', restaurant);
  }

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      setData(null);
      return;
    }

    if (!restaurant) return;

    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/menu/full?restaurant=${encodeURIComponent(restaurant)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const menuData = await response.json();
        // Sanitize the data to remove null/undefined values before storing
        const sanitizedData = sanitizeMenuData(menuData);
        setData(sanitizedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu data';
        console.error(`Error fetching menu data: ${errorMessage}`);
        setError(errorMessage);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurant, enabled]);

  return {
    data,
    categories: data?.categories || [],
    items: data?.items || [],
    languages: data?.languages || [],
    defaultLanguage: data?.defaultLanguage || 'en',
    isLoading,
    error,
    isSuccess: data !== null && !error,
  };
}