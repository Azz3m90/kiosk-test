import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

export function generateCartItemId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '');
  const chunks = cleaned.match(/.{1,4}/g);
  return chunks ? chunks.join(' ') : cleaned;
}

export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleaned);
}

export function validateExpiryDate(expiryDate: string): boolean {
  const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(`20${match[2]}`, 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiry = new Date(year, month - 1);

  return expiry > now;
}

export function validateCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv);
}

/**
 * Sanitizes image URLs and replaces invalid/null images with placeholder
 * Handles cases like image paths ending with 'null', missing files, etc.
 */
export function getSafeImageUrl(imageUrl: string | null | undefined): string {
  const placeholderUrl = '/assets/placeholder.svg';
  
  // Handle null, undefined, or empty strings
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return placeholderUrl;
  }
  
  // Remove whitespace
  const trimmedUrl = imageUrl.trim();
  
  // Check for 'null' string literal or URLs ending with '/null'
  if (trimmedUrl === 'null' || trimmedUrl.endsWith('/null') || trimmedUrl.endsWith('null')) {
    return placeholderUrl;
  }
  
  // Check for URLs with invalid patterns
  if (trimmedUrl.includes('undefined') || trimmedUrl.includes('NaN')) {
    return placeholderUrl;
  }
  
  // Return the original URL if it looks valid
  return trimmedUrl;
}