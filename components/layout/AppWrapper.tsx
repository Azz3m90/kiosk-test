'use client';

import { useState, useEffect, useRef } from 'react';
import { useKiosk } from '@/context/KioskContext';
import { useLanguages } from '@/hooks/useLanguages';
import { useMenuData } from '@/hooks/useMenuData';
import { RestaurantSetupModal } from '@/components/ui/RestaurantSetupModal';
import type { Language } from '@/types';

interface AppWrapperProps {
  children: React.ReactNode;
}

type SetupState = 'idle' | 'validating' | 'fetching_languages' | 'fetching_menu' | 'success' | 'error';

interface RestaurantInfo {
  name: string;
  firstName: string;
  lastName: string;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const { showSetup, saveRestaurantInfo, setAvailableLanguages } = useKiosk();
  const [pendingRestaurantInfo, setPendingRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [pendingRestaurantName, setPendingRestaurantName] = useState<string>('');
  const [debouncedRestaurantName, setDebouncedRestaurantName] = useState<string>('');
  const [setupState, setSetupState] = useState<SetupState>('idle');
  const [setupError, setSetupError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const MAX_RETRIES = 3;
  const DEBOUNCE_DELAY = 500; // 500ms debounce

  // Debounce the restaurant name to prevent race conditions
  useEffect(() => {
    console.log('⏱️ AppWrapper: Debounce effect triggered with pendingRestaurantName:', pendingRestaurantName);
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!pendingRestaurantName.trim()) {
      console.log('⏱️ AppWrapper: Clearing debounce (empty name)');
      setDebouncedRestaurantName('');
      setSetupState('idle');
      setSetupError('');
      return;
    }

    // Set timer for debounced call
    console.log('⏱️ AppWrapper: Setting debounce timer for:', pendingRestaurantName);
    debounceTimerRef.current = setTimeout(() => {
      if (pendingRestaurantName.trim().length >= 2) {
        console.log('⏱️ AppWrapper: Debounce timer fired, setting debouncedRestaurantName:', pendingRestaurantName.trim());
        setDebouncedRestaurantName(pendingRestaurantName.trim());
        setSetupState('validating');
        setSetupError('');
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pendingRestaurantName]);

  // Fetch languages when debounced name is ready
  const { 
    data: languagesData, 
    isLoading: languagesLoading, 
    error: languagesError 
  } = useLanguages({
    restaurant: debouncedRestaurantName,
    enabled: Boolean(debouncedRestaurantName) && setupState !== 'success',
  });

  // Optionally pre-fetch menu data
  const { 
    data: menuData,
    isLoading: menuLoading,
    error: menuError 
  } = useMenuData({
    restaurant: debouncedRestaurantName,
    enabled: Boolean(debouncedRestaurantName) && setupState === 'fetching_menu',
  });

  // Monitor language fetch state
  useEffect(() => {
    console.log('📍 AppWrapper useEffect triggered:',  {
      debouncedRestaurantName,
      setupState,
      languagesLoading,
      languagesError: languagesError ? 'ERROR' : 'null',
      languagesData: languagesData ? 'DATA' : 'null'
    });

    if (!debouncedRestaurantName) {
      console.log('🔌 AppWrapper: No debounced restaurant name, returning');
      return;
    }

    // Transition to fetching_languages when loading starts OR when data is already available from cache
    if ((setupState === 'validating' && languagesLoading) || (setupState === 'validating' && languagesData)) {
      console.log('🔄 AppWrapper: Transitioning to fetching_languages for', debouncedRestaurantName, { languagesLoading, hasData: !!languagesData });
      setSetupState('fetching_languages');
      return;  // Exit early to let the next render cycle process the data
    }

    if (languagesError) {
      console.error('❌ AppWrapper: Languages error:', languagesError);
      const errorMsg = languagesError.includes('404') || languagesError.includes('not found')
        ? `Restaurant "${debouncedRestaurantName}" not found. Please check the name and try again.`
        : languagesError;
      setSetupError(errorMsg);
      setSetupState('error');
      setRetryCount(prev => prev + 1);
    } else if (languagesData && setupState === 'fetching_languages') {
      console.log('✅ AppWrapper: CONDITION MET - Data available and in fetching_languages state');
      console.log('✅ AppWrapper: languagesData:', languagesData);
      console.log('✅ AppWrapper: languagesData type:', typeof languagesData);
      console.log('✅ AppWrapper: languagesData.languages:', languagesData.languages);
      console.log('✅ AppWrapper: Has languages property:', 'languages' in languagesData);
      // Languages successfully fetched
      console.log('✅ AppWrapper: Languages fetched successfully:', languagesData);
      console.log('📊 AppWrapper: Languages array structure:', JSON.stringify(languagesData.languages, null, 2));
      setSetupError('');
      
      // Extract language codes from the fetched data
      // Handle different possible language structures
      const languageCodes = languagesData.languages
        .filter((lang: any) => {
          // Log each language to debug structure
          console.log('🔍 AppWrapper: Processing language:', lang);
          // Accept languages that are either:
          // 1. Marked as available (isAvailable: true)
          // 2. Or just exist in the array (backwards compatibility)
          return lang.isAvailable !== false;
        })
        .map((lang: any) => lang.code as Language);
      
      console.log('✅ AppWrapper: Extracted language codes:', languageCodes);
      
      // Get the default language
      const defaultLang = (languagesData.default_language?.code as Language) || 'en';
      console.log('✅ AppWrapper: Default language:', defaultLang);
      
      // Validate that we have at least one language
      if (languageCodes.length === 0) {
        console.error('❌ AppWrapper: No languages available');
        console.error('❌ AppWrapper: All languages:', languagesData.languages);
        setSetupError('No languages available for this restaurant');
        setSetupState('error');
        return;
      }
      
      console.log('✅ AppWrapper: Setting available languages:', languageCodes, 'with default:', defaultLang);
      
      // Store the available languages in context
      setAvailableLanguages(languageCodes, defaultLang);
      
      // Optional: Pre-fetch menu for better UX
      // Commented out for now - enable if menu is large and you want to cache it
      // setSetupState('fetching_menu');
      
      // Save restaurant info when languages are loaded successfully
      if (pendingRestaurantInfo) {
        saveRestaurantInfo(pendingRestaurantInfo.name, pendingRestaurantInfo.firstName, pendingRestaurantInfo.lastName);
        console.log('✅ AppWrapper: Saved restaurant info:', pendingRestaurantInfo);
      } else {
        console.warn('⚠️ AppWrapper: No pending restaurant info available');
      }
      
      setSetupState('success');
      console.log('✅ AppWrapper: Setup complete, switching to success state');
      
      // Reset for next setup if needed
      setTimeout(() => {
        console.log('✅ AppWrapper: Resetting setup state after success');
        setPendingRestaurantName('');
        setDebouncedRestaurantName('');
        setPendingRestaurantInfo(null);
        setSetupState('idle');
        setRetryCount(0);
      }, 500);
    }
  }, [debouncedRestaurantName, languagesLoading, languagesError, languagesData, setupState, pendingRestaurantInfo, saveRestaurantInfo, setAvailableLanguages]);

  // Monitor menu fetch state (optional)
  useEffect(() => {
    if (setupState !== 'fetching_menu') {
      return;
    }

    if (menuError) {
      // Menu fetch error - continue anyway, menu will load on demand
      console.warn('Menu pre-fetch failed:', menuError);
      if (pendingRestaurantInfo) {
        saveRestaurantInfo(pendingRestaurantInfo.name, pendingRestaurantInfo.firstName, pendingRestaurantInfo.lastName);
      }
      setSetupState('success');
      
      setTimeout(() => {
        setPendingRestaurantName('');
        setDebouncedRestaurantName('');
        setPendingRestaurantInfo(null);
        setSetupState('idle');
        setRetryCount(0);
      }, 500);
    } else if (menuData && !menuLoading) {
      // Menu successfully pre-fetched
      if (pendingRestaurantInfo) {
        saveRestaurantInfo(pendingRestaurantInfo.name, pendingRestaurantInfo.firstName, pendingRestaurantInfo.lastName);
      }
      setSetupState('success');
      
      setTimeout(() => {
        setPendingRestaurantName('');
        setDebouncedRestaurantName('');
        setPendingRestaurantInfo(null);
        setSetupState('idle');
        setRetryCount(0);
      }, 500);
    }
  }, [menuData, menuLoading, menuError, debouncedRestaurantName, setupState, pendingRestaurantInfo, saveRestaurantInfo]);

  const handleSetupSubmit = (restaurantName: string, firstName: string, lastName: string) => {
    console.log('📝 AppWrapper: handleSetupSubmit called with:', { restaurantName, firstName, lastName });
    // Reset error and retry count on new submission
    setSetupError('');
    setRetryCount(0);
    // Store all restaurant info
    setPendingRestaurantInfo({ name: restaurantName, firstName, lastName });
    // Set the new restaurant name to trigger debounce validation
    // The debounce effect will handle the timing
    setPendingRestaurantName(restaurantName);
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      // Reset state so user can try a new restaurant name
      console.log('🔄 AppWrapper: Retry - Resetting state for new attempt');
      setSetupError('');
      setPendingRestaurantName('');
      setDebouncedRestaurantName('');
      setSetupState('idle');
    } else {
      setSetupError('Maximum retry attempts reached. Please check your restaurant name and try again.');
    }
  };

  const isLoading = setupState === 'validating' || setupState === 'fetching_languages' || setupState === 'fetching_menu';
  const showRetryOption = setupState === 'error' && retryCount < MAX_RETRIES;

  return (
    <>
      <RestaurantSetupModal
        isOpen={showSetup}
        onSave={handleSetupSubmit}
        isLoading={isLoading}
        loadingError={setupError}
        onRetry={showRetryOption ? handleRetry : undefined}
        retryCount={retryCount}
        maxRetries={MAX_RETRIES}
      />
      {children}
    </>
  );
}