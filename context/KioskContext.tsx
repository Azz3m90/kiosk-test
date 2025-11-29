'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
  CartItem,
  Step,
  Language,
  Theme,
  ViewMode,
  GridColumns,
  KioskContextType,
  OrderSummary,
  OrderType,
  ToastMessage,
  RestaurantLogo,
  DiningMethod,
  DiningMethodInfo,
  PaymentMethod,
  PaymentMethodInfo,
} from '@/types';
import { Toast } from '@/components/ui/Toast';

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export function KioskProvider({ children }: { children: React.ReactNode }) {
  // State for restaurant configuration (persisted separately)
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantFirstName, setRestaurantFirstName] = useState<string>('');
  const [restaurantLastName, setRestaurantLastName] = useState<string>('');
  const [restaurantRef, setRestaurantRef] = useState<string>('');
  const [restaurantLogo, setRestaurantLogo] = useState<RestaurantLogo>({ header: null, footer: null });
  const [showSetup, setShowSetup] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // State for restaurant-specific languages
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>(['en', 'fr', 'nl', 'de', 'es', 'it']);
  const [defaultRestaurantLanguage, setDefaultRestaurantLanguage] = useState<Language>('en');
  
  // State for restaurant email
  const [restaurantEmail, setRestaurantEmail] = useState<string>('');

  // Initialize restaurant name, first name, last name and languages from localStorage on first load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedRestaurantData = localStorage.getItem('kiosk_restaurant_info');
    if (storedRestaurantData) {
      try {
        const data = JSON.parse(storedRestaurantData);
        const restaurantNameValue = data.name || '';
        setRestaurantName(restaurantNameValue);
        setRestaurantFirstName(data.firstName || '');
        setRestaurantLastName(data.lastName || '');
        console.log('✅ KioskContext: Loaded restaurant info from storage:', { name: restaurantNameValue, firstName: data.firstName, lastName: data.lastName });
        
        // Try to load cached languages for this restaurant
        const cachedLanguagesKey = `languages_${restaurantNameValue}`;
        const cachedLanguages = localStorage.getItem(cachedLanguagesKey);
        if (cachedLanguages) {
          try {
            const languagesData = JSON.parse(cachedLanguages);
            console.log('✅ KioskContext: Loaded languages from cache on init:', languagesData);
            
            // Extract language codes
            const languageCodes = languagesData.languages
              .filter((lang: any) => lang.isAvailable !== false)
              .map((lang: any) => lang.code as Language);
            
            const defaultLang = (languagesData.default_language?.code as Language) || 'en';
            
            if (languageCodes.length > 0) {
              setAvailableLanguages(languageCodes);
              setDefaultRestaurantLanguage(defaultLang);
              console.log('✅ KioskContext: Initialized with cached languages:', languageCodes);
            }
          } catch (e) {
            console.warn('⚠️ KioskContext: Failed to parse cached languages');
          }
        }
        
        // Load cached restaurant email
        const cachedEmailKey = `restaurant_email_${restaurantNameValue}`;
        const cachedEmail = localStorage.getItem(cachedEmailKey);
        if (cachedEmail) {
          setRestaurantEmail(cachedEmail);
          console.log('✅ KioskContext: Loaded restaurant email from cache:', cachedEmail);
        }
      } catch (e) {
        console.warn('⚠️ KioskContext: Failed to parse restaurant info, showing setup');
        setShowSetup(true);
      }
    } else {
      // Show setup modal if restaurant info not configured
      setShowSetup(true);
    }
  }, []);

  const saveRestaurantInfo = useCallback((name: string, firstName: string, lastName: string) => {
    if (typeof window !== 'undefined' && name.trim() && firstName.trim() && lastName.trim()) {
      const restaurantInfo = {
        name: name.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim()
      };
      localStorage.setItem('kiosk_restaurant_info', JSON.stringify(restaurantInfo));
      setRestaurantName(name.trim());
      setRestaurantFirstName(firstName.trim());
      setRestaurantLastName(lastName.trim());
      setShowSetup(false);
      console.log('💾 KioskContext: Saved restaurant info:', restaurantInfo);
    }
  }, []);

  // Fetch restaurant configuration (logo, etc.) from API
  useEffect(() => {
    if (!restaurantName) {
      console.log('⏭️ KioskContext: Skipping config fetch - no restaurantName');
      return;
    }

    const fetchRestaurantConfig = async () => {
      try {
        setConfigLoading(true);
        setConfigError(null);
        const url = `/api/config?restaurant=${encodeURIComponent(restaurantName)}`;
        console.log(`🔄 KioskContext: Fetching config from: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          const errorMsg = `Failed to fetch restaurant config: ${response.status}`;
          console.warn(`⚠️ KioskContext: ${errorMsg}`);
          const errorData = await response.json();
          console.warn(`⚠️ KioskContext: Error details:`, errorData);
          setConfigError(errorMsg);
          setConfigLoading(false);
          return;
        }

        const data = await response.json();
        console.log('📦 KioskContext: Full API response:', data);
        
        if (data.success && data.data) {
          console.log('✅ KioskContext: Config data received:', {
            name: data.data.name,
            ref: data.data.ref,
            logo: data.data.logo,
            diningMethods: data.data.diningMethods,
            paymentMethods: data.data.paymentMethods
          });
          
          setRestaurantRef(data.data.ref || '');
          setRestaurantLogo(data.data.logo || { header: null, footer: null });
          
          // Update dining methods from API if available
          if (data.data.diningMethods) {
            setAvailableDiningMethods(data.data.diningMethods);
            console.log('✅ KioskContext: Dining methods updated from API:', data.data.diningMethods);
          }
          
          // Update payment methods from API if available
          if (data.data.paymentMethods) {
            const paymentMethods: Record<PaymentMethod, PaymentMethodInfo> = {
              cash: { title: 'Cash', icon: 'banknote', enabled: false, content: '', bgColor: '#89fb60' },
              credit_card: { title: 'Credit Card', icon: 'creditcard', enabled: false, content: '', bgColor: '#89fb60' },
              bancontact: { title: 'Bancontact', icon: 'bancontact', enabled: false, content: '', bgColor: '#89fb60' },
              vivawallet: { title: 'VivaWallet', icon: 'wallet', enabled: false, content: '', bgColor: '#89fb60' },
              ccv: { title: 'CCV', icon: 'smartphone', enabled: false, content: '', bgColor: '#89fb60' },
              counter: { title: 'Pay at Counter', icon: 'store', enabled: false, content: '', bgColor: '#89fb60' },
            };
            
            Object.entries(data.data.paymentMethods).forEach(([key, method]: [string, any]) => {
              if (key in paymentMethods) {
                paymentMethods[key as PaymentMethod] = {
                  title: method.title,
                  icon: method.icon,
                  enabled: true,
                  content: method.content || '',
                  bgColor: method.bgColor || '#89fb60'
                };
              }
            });
            
            setAvailablePaymentMethods(paymentMethods);
            console.log('✅ KioskContext: Payment methods updated from API:', paymentMethods);
          }
          
          // Extract restaurant email from settings
          if (data.data.settings?.email_title_to_submit_orders?.content) {
            const htmlContent = data.data.settings.email_title_to_submit_orders.content;
            const emailMatch = htmlContent.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            if (emailMatch) {
              const email = emailMatch[0];
              setRestaurantEmail(email);
              
              // Save email to localStorage for persistence
              if (typeof window !== 'undefined') {
                const cacheKey = `restaurant_email_${restaurantName}`;
                localStorage.setItem(cacheKey, email);
                console.log('💾 KioskContext: Saved restaurant email to cache:', { email, cacheKey });
              }
            }
          }
          
          console.log('✅ KioskContext: Restaurant logo state updated:', data.data.logo);
          setConfigLoaded(true);
          setConfigError(null);
        } else {
          const errorMsg = 'Invalid API response structure';
          console.error('❌ KioskContext:', errorMsg);
          setConfigError(errorMsg);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error fetching restaurant config';
        console.error('❌ KioskContext:', errorMsg);
        setConfigError(errorMsg);
      } finally {
        setConfigLoading(false);
      }
    };

    fetchRestaurantConfig();
  }, [restaurantName]);

  const handleSetAvailableLanguages = useCallback((languages: Language[], defaultLanguage: Language) => {
    setAvailableLanguages(languages);
    setDefaultRestaurantLanguage(defaultLanguage);
    
    // Persist to localStorage for persistence across page reloads
    if (typeof window !== 'undefined') {
      // Store the languages data in the same format as the hook cache
      const languagesData = {
        languages: languages.map(code => ({ code, isAvailable: true })),
        default_language: { code: defaultLanguage }
      };
      const cachedLanguagesKey = `languages_${restaurantName}`;
      localStorage.setItem(cachedLanguagesKey, JSON.stringify(languagesData));
      console.log('💾 KioskContext: Saved languages to cache:', cachedLanguagesKey, languagesData);
    }
  }, [restaurantName]);

  // Reset session function
  const resetSession = useCallback(() => {
    setCart([]);
    setCurrentStep('welcome');
    setCurrentLanguage('en');
    setOrderType(null);
    setDiningMethod(null);
    setToast({ message: 'Session expired. Starting new session.', type: 'info' });
    
    // Clear all browser storage EXCEPT restaurant configuration and language cache
    if (typeof window !== 'undefined') {
      const savedRestaurantInfo = localStorage.getItem('kiosk_restaurant_info');
      const restaurantName = savedRestaurantInfo ? JSON.parse(savedRestaurantInfo).name : null;
      const cachedLanguagesKey = restaurantName ? `languages_${restaurantName}` : null;
      const cachedLanguages = cachedLanguagesKey ? localStorage.getItem(cachedLanguagesKey) : null;
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore restaurant info and languages cache after clearing
      if (savedRestaurantInfo) {
        localStorage.setItem('kiosk_restaurant_info', savedRestaurantInfo);
      }
      if (cachedLanguages && cachedLanguagesKey) {
        localStorage.setItem(cachedLanguagesKey, cachedLanguages);
        console.log('💾 KioskContext: Preserved languages cache during reset');
      }
      
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
    }
  }, []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridColumns, setGridColumns] = useState<GridColumns>(3);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [diningMethod, setDiningMethod] = useState<DiningMethod | null>(null);
  const [availableDiningMethods, setAvailableDiningMethods] = useState<Record<DiningMethod, DiningMethodInfo>>({
    eatin: { title: 'Eat In', bgColor: 'emerald', enabled: true },
    pickup: { title: 'Pickup', bgColor: 'orange', enabled: true },
    delivery: { title: 'Delivery', bgColor: 'blue', enabled: false },
  });
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Record<PaymentMethod, PaymentMethodInfo>>({
    cash: { title: 'Cash', icon: 'banknote', enabled: true },
    credit_card: { title: 'Credit Card', icon: 'creditcard', enabled: false },
    bancontact: { title: 'Bancontact', icon: 'bancontact', enabled: false },
    vivawallet: { title: 'VivaWallet', icon: 'wallet', enabled: false },
    ccv: { title: 'CCV', icon: 'smartphone', enabled: false },
    counter: { title: 'Pay at Counter', icon: 'store', enabled: false },
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Session timeout and security management
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if restrictions are enabled
    const enableRestrictions = process.env.NEXT_PUBLIC_ENABLE_KIOSK_RESTRICTIONS !== 'false';

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    const checkSession = () => {
      const now = Date.now();
      if (now - lastActivity >= SESSION_TIMEOUT) {
        resetSession();
      }
    };

    // Prevent right-click context menu
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
    };

    // Prevent keyboard shortcuts
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      const preventedKeys = ['F12', 'F5', 'F11'];
      if (
        (e.ctrlKey && ['r', 'p', 's', 'u'].includes(e.key.toLowerCase())) ||
        preventedKeys.includes(e.key)
      ) {
        e.preventDefault();
      }
    };

    // Add event listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    if (enableRestrictions) {
      window.addEventListener('contextmenu', preventContextMenu);
      window.addEventListener('keydown', preventKeyboardShortcuts);
    }

    // Check session every minute
    const sessionInterval = setInterval(checkSession, 60000);

    // Fullscreen request disabled - restrictions are off
    // if (enableRestrictions && document.fullscreenEnabled) {
    //   document.documentElement.requestFullscreen().catch((err) => {
    //     if (err.name !== 'NotAllowedError') {
    //       console.warn('Fullscreen request failed:', err.message);
    //     }
    //   });
    // }

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (enableRestrictions) {
        window.removeEventListener('contextmenu', preventContextMenu);
        window.removeEventListener('keydown', preventKeyboardShortcuts);
      }
      clearInterval(sessionInterval);
    };
  }, [lastActivity]);
  //     }
  //   }
  // }, []);

  // Apply theme to document instantly (best practice for kiosks)
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme change instantly - no animations
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  const addToCart = useCallback((item: CartItem) => {
    console.log('Adding item to cart:', item);
    setCart((prevCart) => {
      // Helper function to compare if two items are identical
      const areItemsIdentical = (cartItem: CartItem, newItem: CartItem): boolean => {
        // Must be same menu item
        if (cartItem.menuItemId !== newItem.menuItemId) return false;
        
        // Compare special instructions (treat undefined and empty string as same)
        const cartInstructions = cartItem.specialInstructions?.trim() || '';
        const newInstructions = newItem.specialInstructions?.trim() || '';
        if (cartInstructions !== newInstructions) return false;
        
        // Compare selected options
        const cartOptions = cartItem.selectedOptions || [];
        const newOptions = newItem.selectedOptions || [];
        
        if (cartOptions.length !== newOptions.length) return false;
        
        // Sort and compare options
        const sortedCartOptions = [...cartOptions].sort((a, b) => a.optionName.localeCompare(b.optionName));
        const sortedNewOptions = [...newOptions].sort((a, b) => a.optionName.localeCompare(b.optionName));
        
        return sortedCartOptions.every((cartOpt, index) => {
          const newOpt = sortedNewOptions[index];
          if (cartOpt.optionName !== newOpt.optionName) return false;
          if (cartOpt.additionalPrice !== newOpt.additionalPrice) return false;
          
          // Handle both array and object (Record) formats for choices
          const cartChoicesStr = Array.isArray(cartOpt.choices) 
            ? cartOpt.choices.sort().join('|')
            : Object.entries(cartOpt.choices).map(([name, qty]) => `${qty}x${name}`).sort().join('|');
          
          const newChoicesStr = Array.isArray(newOpt.choices)
            ? newOpt.choices.sort().join('|')
            : Object.entries(newOpt.choices).map(([name, qty]) => `${qty}x${name}`).sort().join('|');
          
          return cartChoicesStr === newChoicesStr;
        });
      };

      // Check if identical item exists (same item, same options, same instructions)
      const existingItemIndex = prevCart.findIndex((cartItem) => 
        areItemsIdentical(cartItem, item)
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + item.quantity,
        };
        console.log('Grouped identical item, updated cart:', newCart);
        return newCart;
      }

      // Add new item (different instructions or options)
      const newCart = [...prevCart, item];
      console.log('Added new item to cart:', newCart);
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const updateCartItem = useCallback((itemId: string, updatedItem: CartItem) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...updatedItem, id: itemId } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const navigateToStep = useCallback((step: Step) => {
    // Allow navigation to all pages (cart requirement removed for swipe navigation)
    setCurrentStep(step);
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setCurrentLanguage(lang);
    // DISABLED: Persist to localStorage
    // if (typeof window !== 'undefined') {
    //   localStorage.setItem('kiosk_language', lang);
    //   console.log('Saved language to localStorage:', lang);
    // }
  }, []);

  const handleSetOrderType = useCallback((type: OrderType) => {
    setOrderType(type);
    // DISABLED: Persist to localStorage
    // if (typeof window !== 'undefined') {
    //   localStorage.setItem('kiosk_orderType', type);
    //   console.log('Saved order type to localStorage:', type);
    // }
  }, []);

  const toggleTheme = useCallback(() => {
    setCurrentTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
  }, []);

  const handleSetGridColumns = useCallback((columns: GridColumns) => {
    setGridColumns(columns);
  }, []);

  const handleSetDiningMethod = useCallback((method: DiningMethod) => {
    setDiningMethod(method);
    console.log('✅ KioskContext: Dining method set to:', method);
  }, []);

  const handleSetAvailableDiningMethods = useCallback((methods: Record<DiningMethod, DiningMethodInfo>) => {
    setAvailableDiningMethods(methods);
    console.log('✅ KioskContext: Available dining methods updated:', methods);
  }, []);

  const getOrderSummary = useCallback((): OrderSummary => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.finalPrice * item.quantity,
      0
    );
    const tax = 0;
    const total = subtotal;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      tax,
      total,
      itemCount,
    };
  }, [cart]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' | 'eatin' | 'pickup' | 'delivery' = 'info',
    position: 'top-center' | 'bottom-right' | 'bottom-center' = 'top-center',
    duration: number = 3000
  ) => {
    setToast({ message, type, position, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const resetKiosk = useCallback(() => {
    setCart([]);
    setCurrentStep('welcome');
    setCurrentLanguage('en');
    setCurrentTheme('light');
    setViewMode('grid');
    setGridColumns(3);
    setOrderType(null);
    setDiningMethod(null);
    setToast(null);
    
    // Preserve restaurant configuration and language cache during reset
    if (typeof window !== 'undefined') {
      const savedRestaurant = localStorage.getItem('kiosk_restaurant_name');
      const cachedLanguagesKey = savedRestaurant ? `languages_${savedRestaurant}` : null;
      const cachedLanguages = cachedLanguagesKey ? localStorage.getItem(cachedLanguagesKey) : null;
      
      localStorage.clear();
      
      if (savedRestaurant) {
        localStorage.setItem('kiosk_restaurant_name', savedRestaurant);
      }
      if (cachedLanguages && cachedLanguagesKey) {
        localStorage.setItem(cachedLanguagesKey, cachedLanguages);
        console.log('💾 KioskContext: Preserved languages cache during kiosk reset');
      }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSetAvailablePaymentMethods = useCallback((methods: Record<PaymentMethod, PaymentMethodInfo>) => {
    setAvailablePaymentMethods(methods);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      currentStep,
      currentLanguage,
      currentTheme,
      viewMode,
      gridColumns,
      orderType,
      diningMethod,
      availableDiningMethods,
      availablePaymentMethods,
      toast,
      restaurantName,
      restaurantFirstName,
      restaurantLastName,
      restaurantRef,
      restaurantLogo,
      restaurantEmail,
      showSetup,
      availableLanguages,
      defaultRestaurantLanguage,
      configLoading,
      configError,
      configLoaded,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCartItem,
      clearCart,
      navigateToStep,
      changeLanguage,
      setOrderType: handleSetOrderType,
      setDiningMethod: handleSetDiningMethod,
      setAvailableDiningMethods: handleSetAvailableDiningMethods,
      setAvailablePaymentMethods: handleSetAvailablePaymentMethods,
      toggleTheme,
      toggleViewMode,
      setGridColumns: handleSetGridColumns,
      getOrderSummary,
      resetKiosk,
      showToast,
      hideToast,
      saveRestaurantInfo,
      setShowSetup,
      setAvailableLanguages: handleSetAvailableLanguages,
      setRestaurantRef,
      setRestaurantLogo,
    }),
    [
      cart,
      currentStep,
      currentLanguage,
      currentTheme,
      viewMode,
      gridColumns,
      orderType,
      diningMethod,
      availableDiningMethods,
      availablePaymentMethods,
      toast,
      restaurantName,
      restaurantFirstName,
      restaurantLastName,
      restaurantRef,
      restaurantLogo,
      restaurantEmail,
      showSetup,
      availableLanguages,
      defaultRestaurantLanguage,
      configLoading,
      configError,
      configLoaded,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCartItem,
      clearCart,
      navigateToStep,
      changeLanguage,
      handleSetOrderType,
      handleSetDiningMethod,
      handleSetAvailableDiningMethods,
      handleSetAvailablePaymentMethods,
      toggleTheme,
      toggleViewMode,
      handleSetGridColumns,
      getOrderSummary,
      resetKiosk,
      showToast,
      hideToast,
      saveRestaurantInfo,
      handleSetAvailableLanguages,
    ]
  );

  return (
    <KioskContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position={toast.position || 'top-center'}
          duration={toast.duration || 3000}
        />
      )}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const context = useContext(KioskContext);
  if (context === undefined) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
}