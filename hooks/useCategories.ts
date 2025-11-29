'use client';

import { useState, useEffect } from 'react';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  imageUrl?: string | null;
  order?: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 0, name: 'All', slug: 'all', order: -1 },
  { id: 1, name: 'Appetizers', slug: 'appetizers', order: 0 },
  { id: 2, name: 'Main Courses', slug: 'mains', order: 1 },
  { id: 3, name: 'Desserts', slug: 'desserts', order: 2 },
  { id: 4, name: 'Hot Drinks', slug: 'hot', order: 3 },
  { id: 5, name: 'Cold Drinks', slug: 'cold', order: 4 },
  { id: 6, name: 'Alcoholic', slug: 'alcoholic', order: 5 },
];

/**
 * Hook to fetch and manage menu categories
 * Fetches from backend API with fallback to default categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/backend-categories', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'force-cache',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
        console.warn(`Error fetching categories, using defaults: ${errorMessage}`);
        setError(errorMessage);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
    isUsingDefaults: categories === DEFAULT_CATEGORIES,
  };
}