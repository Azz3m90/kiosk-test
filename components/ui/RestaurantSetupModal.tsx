'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { KeyboardInput } from '@/components/ui/KeyboardInput';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';

interface RestaurantSetupModalProps {
  onSave: (restaurantName: string, firstName: string, lastName: string) => void;
  isOpen: boolean;
  isLoading?: boolean;
  loadingError?: string;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export function RestaurantSetupModal({ 
  onSave, 
  isOpen, 
  isLoading = false, 
  loadingError,
  onRetry,
  retryCount = 0,
  maxRetries = 3
}: RestaurantSetupModalProps) {
  const { t } = useTranslation();
  const [restaurantName, setRestaurantName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [cachedInvalidName, setCachedInvalidName] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load cached invalid name from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const cached = localStorage.getItem('invalid_restaurant_name');
      if (cached) {
        setCachedInvalidName(cached);
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (firstName.trim()) {
      setError('');
    }
  }, [firstName]);

  // Show loading error if it occurs during language fetch
  // Clear any previous errors when loadingError changes
  // This prevents old errors from blocking new input attempts
  useEffect(() => {
    if (loadingError) {
      // If there's a loading error and no input, show it
      if (!restaurantName.trim()) {
        setError(loadingError);
        // Focus on restaurant name field when error appears
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
      // If there's input, don't show the loading error (user is retrying)
    } else {
      // If loadingError is cleared, clear the local error too
      if (error) {
        setError('');
      }
    }
  }, [loadingError, restaurantName, error]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log('✅ Modal: handleSubmit called with:', { restaurantName, firstName, error });
    
    if (!restaurantName.trim()) {
      console.log('❌ Modal: Restaurant name is empty');
      const errorMsg = t('restaurant_name_required') || 'Restaurant name is required';
      setError(errorMsg);
      localStorage.setItem('invalid_restaurant_name', restaurantName.trim() || 'EMPTY');
      setCachedInvalidName(restaurantName.trim() || 'EMPTY');
      return;
    }

    if (restaurantName.trim().length < 2) {
      console.log('❌ Modal: Restaurant name too short');
      const errorMsg = t('restaurant_name_min_length') || 'Restaurant name must be at least 2 characters';
      setError(errorMsg);
      localStorage.setItem('invalid_restaurant_name', restaurantName.trim());
      setCachedInvalidName(restaurantName.trim());
      return;
    }

    if (!firstName.trim()) {
      console.log('❌ Modal: First name is empty');
      const errorMsg = 'Kiosk name is required';
      setError(errorMsg);
      localStorage.setItem('invalid_restaurant_name', restaurantName.trim());
      setCachedInvalidName(restaurantName.trim());
      return;
    }

    console.log('📤 Modal: Calling onSave with:', { restaurantName: restaurantName.trim(), firstName: firstName.trim(), lastName: 'kiosk' });
    onSave(restaurantName.trim(), firstName.trim(), 'kiosk');
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      setRestaurantName('');
      setFirstName('');
      setError('');
      setCachedInvalidName('');
      
      localStorage.removeItem('invalid_restaurant_name');
      localStorage.removeItem('kiosk_restaurant_info');
      localStorage.removeItem('kiosk_restaurant_name');
      localStorage.removeItem('restaurant_config_cache');
      localStorage.clear();
      
      sessionStorage.clear();
      
      if (window.indexedDB) {
        const dbs = await window.indexedDB.databases?.() || [];
        for (const db of dbs) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-primary-200 dark:border-primary-700 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 rounded-t-xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8" />
            <h1 className="text-2xl font-bold">
              {t('welcome_to_kiosk') || 'Welcome to Kiosk'}
            </h1>
          </div>
          <p className="text-primary-100 text-sm">
            {t('setup_restaurant_description') || 'Configure your restaurant to get started'}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('restaurant_name_info') || 'Enter your restaurant name to configure the kiosk. This will be used to fetch your menu and settings.'}
            </p>
          </div>

          {/* Inputs - Grid Layout */}
          <div className="space-y-3">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t('restaurant_name') || 'Restaurant Name'} <span className="text-red-500">*</span>
              </label>
              <KeyboardInput
                inputType="text"
                ref={inputRef}
                value={restaurantName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setRestaurantName(newValue);
                  if (newValue.trim()) {
                    setError('');
                  }
                }}
                placeholder="e.g., My Restaurant"
                maxLength={100}
                aria-label="Restaurant name"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:border-primary-500 dark:focus:border-primary-400
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         text-base font-medium"
              />
            </div>

            {/* Kiosk Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t('kiosk_name') || 'Kiosk Name'} <span className="text-red-500">*</span>
              </label>
              <KeyboardInput
                inputType="text"
                value={firstName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFirstName(newValue);
                  if (newValue.trim()) {
                    setError('');
                  }
                }}
                placeholder="e.g., Kiosk 1"
                maxLength={50}
                aria-label="Kiosk name"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:border-primary-500 dark:focus:border-primary-400
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         text-base font-medium"
              />
            </div>
          </div>

          {/* Cached Invalid Name Warning */}
          {cachedInvalidName && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold">⚠️ Previous Invalid Entry Cached</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Last invalid restaurant name: <span className="font-mono bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded">{cachedInvalidName === 'EMPTY' ? '(empty)' : cachedInvalidName}</span>
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Click the "Clear" button below to remove this cache and enter a valid restaurant name.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message with Retry Info */}
          {error && (
            <div 
              role="alert" 
              aria-live="polite" 
              aria-atomic="true"
              className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div>
                <p className="text-sm text-red-700 dark:text-red-200 font-semibold mb-1 flex items-center gap-2">
                  <span aria-hidden="true">⚠️</span>
                  <span>{t('error') || 'Error'}</span>
                </p>
                <p className="text-sm text-red-700 dark:text-red-200 leading-relaxed" id="error-message">
                  {error}
                </p>
              </div>
              {onRetry && retryCount < maxRetries && (
                <div className="space-y-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-300 font-medium" id="retry-count">
                    {t('retry_attempt') || `Retry attempt ${retryCount}/${maxRetries}`}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 flex items-center gap-1">
                    <span aria-hidden="true">💡</span>
                    <span>Clear the field or type a different restaurant name and try again.</span>
                  </p>
                </div>
              )}
              {retryCount >= maxRetries && (
                <p className="text-xs text-red-600 dark:text-red-300 font-medium pt-2 border-t border-red-200 dark:border-red-800" id="max-retries-warning">
                  <span aria-hidden="true">❌</span> {t('max_retries_reached') || 'Maximum retry attempts reached. Please check your restaurant name and try again.'}
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-200 font-medium">
                    {t('fetching_languages') || 'Validating restaurant...'}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {t('validation_in_progress') || 'Please wait while we verify your restaurant name and fetch available languages.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit/Retry/Clear Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Main Submit Button */}
            <button
              type="submit"
              onClick={() => handleSubmit()}
              disabled={!restaurantName.trim() || !firstName.trim() || isLoading}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                       disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                       text-white font-bold py-3 px-4 rounded-lg transition-all duration-200
                       flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl
                       active:scale-95 col-span-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  {t('loading') || 'Loading...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('continue') || 'Continue'}
                </>
              )}
            </button>

            {/* Clear Button - Always available when there's input */}
            {(restaurantName.trim() || firstName.trim()) && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isClearing}
                className="bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700
                         disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                         text-white font-bold py-3 px-4 rounded-lg transition-all duration-200
                         flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
                         active:scale-95"
              >
                {isClearing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{t('loading') || 'Clearing...'}</span>
                  </>
                ) : (
                  <>✕ {t('clear') || 'Clear'}</>
                )}
              </button>
            )}

            {/* Retry Button - Only show when error, retries available, and input is empty */}
            {onRetry && error && retryCount < maxRetries && !isLoading && !restaurantName.trim() && (
              <button
                type="button"
                onClick={() => {
                  // Just call retry - user will see empty field and can type new name
                  onRetry();
                }}
                className="col-span-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700
                         text-white font-bold py-3 px-4 rounded-lg transition-all duration-200
                         flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl
                         active:scale-95"
              >
                ↻ {t('retry') || 'Retry'} ({retryCount}/{maxRetries})
              </button>
            )}
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('setup_persistent_note') || 'This configuration will be saved and persist across sessions.'}
          </p>
        </form>
      </div>
    </div>
  );
}