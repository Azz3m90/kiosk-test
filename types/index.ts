// Core Types
export type Language = 'en' | 'fr' | 'nl' | 'de' | 'es' | 'it';

export type Theme = 'light' | 'dark';

export type ViewMode = 'grid' | 'list';

export type GridColumns = 2 | 3 | 4 | 5;

export type FoodCategory = 'appetizers' | 'mains' | 'desserts';
export type DrinkCategory = 'hot' | 'cold' | 'alcoholic';

export type PaymentMethod = 'cash' | 'credit_card' | 'bancontact' | 'vivawallet' | 'ccv' | 'counter';

export type OrderType = 'takeaway' | 'eatin';

export type DiningMethod = 'eatin' | 'pickup' | 'delivery';

export type Step = 'welcome' | 'diningPreference' | 'orderType' | 'menu' | 'review' | 'payment';

// Option Types
export interface OptionChoice {
  name: string;
  price: number;
  image?: string;
  id?: number | string;
  ref?: number | string;
  categoryId?: number | string;
  categoryRef?: number | string;
}

export interface ItemOption {
  name: string;
  type: 'radio' | 'checkbox';
  required: boolean;
  choices: OptionChoice[];
  maxSelection?: number;
  minSelection?: number;
  sourceType?: 'menuItem' | 'menuCategory' | 'addition'; // Track where the option came from
  allowPerChoiceQuantity?: boolean; // If true, show +/- buttons for each choice
}

// Menu Item Types
export interface BaseMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  basePrice?: number;
  image: string;
  hasOptions?: boolean;
  options?: ItemOption[];
  type?: 'food' | 'drink';
}

export interface FoodItem extends BaseMenuItem {
  category: FoodCategory | string; // Allow string for dynamic categories from API
  type?: 'food';
}

export interface DrinkItem extends BaseMenuItem {
  category: DrinkCategory | string; // Allow string for dynamic categories from API
  type?: 'drink';
}

export type MenuItem = FoodItem | DrinkItem;

// Cart Types
export interface SelectedOption {
  optionName: string;
  choices: string[] | Record<string, number>; // Support both legacy array and new quantity format
  additionalPrice: number;
}

export interface OrderMenuItem {
  ref?: number | string;
  title: string;
  extra: number;
  quantity: number;
  price: {
    unit_price: {
      amount: number;
      currency_code: string;
      formatted_amount: string;
    };
    total_price: {
      amount: number;
      currency_code: string;
      formatted_amount: string;
    };
  };
}

export interface MenuCategory {
  ref: string;
  title: string;
  category_ref: string;
  category_title: string;
  quantity: number;
  price: {
    unit_price: {
      amount: number;
      currency_code: string;
      formatted_amount: string;
    };
    total_price: {
      amount: number;
      currency_code: string;
      formatted_amount: string;
    };
  };
}

export interface Addition {
  ref: number;
  title: string;
  quantity: number;
  price: {
    unit_price: {
      amount: number;
      currency_code: string;
      formatted_amount: string;
    };
    total_price: {
      amount: number;
      currency_code: string;
      formatted_amount: string;
    };
  };
}

export interface CartItem {
  id: string; // Unique cart item ID
  ref?: number; // Reference to the menu item in the backend
  menuItemId: number;
  name: string;
  description: string;
  basePrice: number;
  finalPrice: number;
  quantity: number;
  image: string;
  selectedOptions?: SelectedOption[];
  specialInstructions?: string;
  type: 'food' | 'drink';
  menuItems?: OrderMenuItem[];
  menuCategorys?: MenuCategory[];
  additions?: Addition[];
}

// Translation Types
export interface Translations {
  [key: string]: string;
}

export interface LanguageTranslations {
  [key: string]: Translations;
}

// Restaurant Data Types
export interface RestaurantData {
  name: string;
  logo: string;
  foodItems: FoodItem[];
  drinkItems: DrinkItem[];
  translations: LanguageTranslations;
}

// Filter Types
export interface FilterState {
  category: string;
  priceMin: number;
  priceMax: number;
  priceRange: 'all' | 'budget' | 'mid' | 'premium';
}

export interface Filters {
  food: FilterState;
  drinks: FilterState;
}

// Order Summary Types
export interface OrderSummary {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

// Payment Form Types
export interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

// Toast Types
export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'eatin' | 'pickup' | 'delivery';
  position?: 'top-center' | 'bottom-right' | 'bottom-center';
  duration?: number;
}

// Restaurant Logo Types
export interface RestaurantLogo {
  header: string | null;
  footer: string | null;
}

// Dining Method Types
export interface DiningMethodInfo {
  title: string;
  bgColor: string;
  enabled: boolean;
}

// Payment Method Types
export interface PaymentMethodInfo {
  title: string;
  icon: string;
  enabled: boolean;
  content?: string;
  bgColor?: string;
}

// Context Types
export interface KioskContextType {
  cart: CartItem[];
  currentStep: Step;
  currentLanguage: Language;
  currentTheme: Theme;
  viewMode: ViewMode;
  gridColumns: GridColumns;
  orderType: OrderType | null;
  toast: ToastMessage | null;
  restaurantName: string;
  restaurantFirstName: string;
  restaurantLastName: string;
  restaurantLogo: RestaurantLogo;
  restaurantRef: string;
  restaurantEmail: string;
  showSetup: boolean;
  availableLanguages: Language[];
  defaultRestaurantLanguage: Language;
  configLoading: boolean;
  configError: string | null;
  configLoaded: boolean;
  diningMethod: DiningMethod | null;
  availableDiningMethods: Record<DiningMethod, DiningMethodInfo>;
  availablePaymentMethods: Record<PaymentMethod, PaymentMethodInfo>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCartItem: (itemId: string, updatedItem: CartItem) => void;
  clearCart: () => void;
  navigateToStep: (step: Step) => void;
  changeLanguage: (lang: Language) => void;
  setOrderType: (type: OrderType) => void;
  toggleTheme: () => void;
  toggleViewMode: () => void;
  setGridColumns: (columns: GridColumns) => void;
  getOrderSummary: () => OrderSummary;
  resetKiosk: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info' | 'eatin' | 'pickup' | 'delivery', position?: 'top-center' | 'bottom-right' | 'bottom-center', duration?: number) => void;
  hideToast: () => void;
  saveRestaurantInfo: (name: string, firstName: string, lastName: string) => void;
  setShowSetup: (show: boolean) => void;
  setAvailableLanguages: (languages: Language[], defaultLanguage: Language) => void;
  setRestaurantLogo: (logo: RestaurantLogo) => void;
  setRestaurantRef: (ref: string) => void;
  setDiningMethod: (method: DiningMethod) => void;
  setAvailableDiningMethods: (methods: Record<DiningMethod, DiningMethodInfo>) => void;
  setAvailablePaymentMethods: (methods: Record<PaymentMethod, PaymentMethodInfo>) => void;
}