/**
 * Data Sanitization Utilities
 * 
 * These functions ensure that null or undefined values from API responses
 * are handled gracefully and don't get displayed as "null" in the UI.
 */

import type { MenuItem, ItemOption, OptionChoice } from '@/types';

/**
 * Sanitize a string value - trim whitespace and convert null/undefined to empty string
 */
export function sanitizeString(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).trim();
}

/**
 * Sanitize a number value - return 0 if null/undefined/invalid
 */
export function sanitizeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Number(value);
}

/**
 * Sanitize an option choice - ensure all required fields are present and valid
 */
export function sanitizeOptionChoice(choice: OptionChoice): OptionChoice {
  return {
    name: sanitizeString(choice.name) || 'Unnamed Option',
    price: sanitizeNumber(choice.price),
    image: sanitizeString(choice.image) || undefined,
    id: choice.id,
    ref: choice.ref,
    categoryId: choice.categoryId,
    categoryRef: choice.categoryRef,
  };
}

/**
 * Sanitize option choices array - filter out nulls and invalid entries
 */
export function sanitizeOptionChoices(choices: OptionChoice[] | null | undefined): OptionChoice[] {
  if (!Array.isArray(choices)) return [];
  
  return choices
    .filter(choice => choice && choice.name) // Filter out null/undefined/empty choices
    .map(choice => sanitizeOptionChoice(choice));
}

/**
 * Sanitize an item option - ensure all required fields are present and valid
 */
export function sanitizeItemOption(option: ItemOption): ItemOption {
  return {
    name: sanitizeString(option.name) || 'Unnamed Option',
    type: option.type === 'checkbox' ? 'checkbox' : 'radio',
    required: option.required === true,
    choices: sanitizeOptionChoices(option.choices),
    maxSelection: sanitizeNumber(option.maxSelection) || undefined,
    minSelection: sanitizeNumber(option.minSelection) || undefined,
    sourceType: option.sourceType || 'menuCategory',
    allowPerChoiceQuantity: option.allowPerChoiceQuantity === true,
  };
}

/**
 * Sanitize options array - filter out nulls and invalid entries
 */
export function sanitizeOptions(options: ItemOption[] | null | undefined): ItemOption[] {
  if (!Array.isArray(options)) return [];
  
  return options
    .filter(option => option && option.name) // Filter out null/undefined/empty options
    .map(option => sanitizeItemOption(option));
}

/**
 * Sanitize a menu item - ensure all required fields are present and valid
 * This is the main function to use for menu item data from API
 */
export function sanitizeMenuItem(item: MenuItem): MenuItem {
  // Skip items with missing name (these are essentially invalid)
  if (!item || !item.name || sanitizeString(item.name).length === 0) {
    return null as any; // Will be filtered out
  }

  return {
    ...item,
    id: sanitizeNumber(item.id),
    name: sanitizeString(item.name),
    description: sanitizeString(item.description),
    price: sanitizeNumber(item.price),
    basePrice: sanitizeNumber(item.basePrice),
    image: sanitizeString(item.image),
    category: sanitizeString(item.category) || 'Uncategorized',
    hasOptions: item.hasOptions === true,
    options: sanitizeOptions(item.options),
    type: item.type === 'drink' ? 'drink' : 'food',
  };
}

/**
 * Sanitize menu items array - filter out nulls, invalid entries, and items with missing names
 */
export function sanitizeMenuItems(items: MenuItem[] | null | undefined): MenuItem[] {
  if (!Array.isArray(items)) return [];
  
  return items
    .map(item => {
      try {
        return sanitizeMenuItem(item);
      } catch (error) {
        console.warn('Failed to sanitize menu item:', item, error);
        return null;
      }
    })
    .filter((item): item is MenuItem => item !== null);
}

/**
 * Sanitize category data
 */
export function sanitizeCategory(category: any): any {
  if (!category) return null;
  
  return {
    id: sanitizeNumber(category.id),
    name: sanitizeString(category.name) || 'Unnamed Category',
    slug: sanitizeString(category.slug) || '',
    description: sanitizeString(category.description),
    color: sanitizeString(category.color),
    imageUrl: sanitizeString(category.imageUrl) || undefined,
    order: sanitizeNumber(category.order),
  };
}

/**
 * Sanitize categories array
 */
export function sanitizeCategories(categories: any[] | null | undefined): any[] {
  if (!Array.isArray(categories)) return [];
  
  return categories
    .map(cat => {
      try {
        return sanitizeCategory(cat);
      } catch (error) {
        console.warn('Failed to sanitize category:', cat, error);
        return null;
      }
    })
    .filter(cat => cat !== null && cat.name);
}

/**
 * Sanitize entire menu data from API response
 */
export function sanitizeMenuData(data: any): any {
  if (!data) {
    return {
      categories: [],
      items: [],
      totalItems: 0,
      totalCategories: 0,
      languages: [],
      defaultLanguage: 'en',
    };
  }

  const sanitizedItems = sanitizeMenuItems(data.items);
  const sanitizedCategories = sanitizeCategories(data.categories);

  return {
    categories: sanitizedCategories,
    items: sanitizedItems,
    totalItems: sanitizedItems.length,
    totalCategories: sanitizedCategories.length,
    languages: Array.isArray(data.languages) ? data.languages.filter((lang: any) => lang) : [],
    defaultLanguage: sanitizeString(data.defaultLanguage) || 'en',
  };
}