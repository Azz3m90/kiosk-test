'use client';

import { useEffect } from 'react';
import { useKiosk } from '@/context/KioskContext';
import { getSafeImageUrl } from '@/lib/utils';
import { restaurantData } from '@/data/restaurant-data';

/**
 * Component to dynamically update the document title and favicon based on restaurant config
 * Uses the exact same logo URL as the Sidebar for consistency
 * Should be placed early in the layout tree to ensure title updates happen quickly
 */
export function DocumentTitleUpdater() {
  const { restaurantName, restaurantLogo } = useKiosk();

  useEffect(() => {
    if (restaurantName) {
      // Update page title
      const newTitle = `${restaurantName} - Kiosk Order System`;
      document.title = newTitle;
      
      // Get the logo URL using the same logic as Sidebar
      // This ensures both sidebar and favicon use the exact same image
      const logoUrl = getSafeImageUrl(restaurantLogo?.header || restaurantData.logo);
      
      // Add cache-busting query parameter to force favicon reload
      const cacheBustingUrl = `${logoUrl}?v=${Date.now()}`;
      
      // Remove ALL existing favicon links to force browser to reload
      const existingIcons = document.querySelectorAll("link[rel*='icon']");
      existingIcons.forEach(icon => icon.remove());
      
      // Create and add new favicon links with cache-busting
      // Primary icon link
      const iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      iconLink.href = cacheBustingUrl;
      iconLink.type = 'image/png';
      document.head.appendChild(iconLink);

      // Shortcut icon link (for older browsers)
      const shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.href = cacheBustingUrl;
      document.head.appendChild(shortcutLink);

      // Apple touch icon link (iOS)
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = cacheBustingUrl;
      document.head.appendChild(appleLink);

      console.log(`🏪 Favicon updated to: ${logoUrl}`);
      console.log(`🏪 Cache-busting URL: ${cacheBustingUrl}`);
      console.log(`🏪 Document title updated to: ${newTitle}`);
    }
  }, [restaurantName, restaurantLogo.header]);

  return null; // This component doesn't render anything
}