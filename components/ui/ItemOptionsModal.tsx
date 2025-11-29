'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice, getSafeImageUrl } from '@/lib/utils';
import { X, Plus, Minus, ShoppingCart, ChevronRight, ChevronLeft, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { KeyboardTextarea } from '@/components/ui/KeyboardInput';
import { CartSidebar } from '@/components/ui/CartSidebar';
import type { 
  MenuItem as MenuItemType, 
  ItemOption, 
  OptionChoice, 
  SelectedOption, 
  CartItem,
  OrderMenuItem,
  MenuCategory,
  Addition
} from '@/types';

interface ItemOptionsModalProps {
  item: MenuItemType;
  initialQuantity?: number;
  cartItemToEdit?: CartItem; // For edit mode
  onClose: () => void;
}

export function ItemOptionsModal({ item, initialQuantity = 1, cartItemToEdit, onClose }: ItemOptionsModalProps) {
  const { addToCart, updateCartItem, cart, getOrderSummary } = useKiosk();
  const { t } = useTranslation();
  const isEditMode = !!cartItemToEdit;
  const cartSummary = getOrderSummary();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  console.log('🎯 ItemOptionsModal opened:', { 
    itemName: item.name, 
    itemId: item.id, 
    isEditMode, 
    cartItemToEdit: cartItemToEdit ? { id: cartItemToEdit.id, name: cartItemToEdit.name } : null 
  });

  // Debug: Log item data with options
  useEffect(() => {
    if (item?.options && item.options.length > 0) {
      console.log('📦 ItemOptionsModal received item:', {
        name: item.name,
        optionsCount: item.options.length,
        firstOption: item.options[0].name,
        firstChoices: item.options[0].choices?.slice(0, 2).map(c => ({
          name: c.name,
          hasImage: !!c.image,
          image: c.image
        }))
      });
    }
  }, [item]);
  
  // Initialize state from cartItemToEdit if in edit mode, otherwise select all options by default
  // selectedChoices now stores quantities: { "Mango": 3, "Strawberry": 1 }
  const [selectedChoices, setSelectedChoices] = useState<Record<string, Record<string, number>>>(() => {
    if (cartItemToEdit?.selectedOptions) {
      const initialChoices: Record<string, Record<string, number>> = {};
      cartItemToEdit.selectedOptions.forEach(opt => {
        // Convert from old format if needed
        if (Array.isArray(opt.choices)) {
          initialChoices[opt.optionName] = {};
          (opt.choices as string[]).forEach(choice => {
            initialChoices[opt.optionName][choice] = 1;
          });
        } else {
          initialChoices[opt.optionName] = opt.choices as Record<string, number>;
        }
      });
      return initialChoices;
    }
    // Select main item options by default (menuItem sourceType only)
    const defaultChoices: Record<string, Record<string, number>> = {};
    if (item.options) {
      item.options.forEach(option => {
        if (option.sourceType === 'menuItem' && option.choices && option.choices.length > 0) {
          defaultChoices[option.name] = {};
          option.choices.forEach(choice => {
            defaultChoices[option.name][choice.name] = 1;
          });
        }
      });
    }
    return defaultChoices;
  });
  const [specialInstructions, setSpecialInstructions] = useState(() => cartItemToEdit?.specialInstructions || '');
  const [quantity, setQuantity] = useState(() => cartItemToEdit?.quantity || initialQuantity);
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Ensure state is synchronized when cartItemToEdit changes (for edit mode)
  useEffect(() => {
    if (isEditMode && cartItemToEdit) {
      // Update special instructions if in edit mode
      setSpecialInstructions(cartItemToEdit.specialInstructions || '');
      setQuantity(cartItemToEdit.quantity);
      
      // Update selected choices
      if (cartItemToEdit.selectedOptions) {
        const initialChoices: Record<string, Record<string, number>> = {};
        cartItemToEdit.selectedOptions.forEach(opt => {
          // Convert from old format if needed
          if (Array.isArray(opt.choices)) {
            initialChoices[opt.optionName] = {};
            (opt.choices as string[]).forEach(choice => {
              initialChoices[opt.optionName][choice] = 1;
            });
          } else {
            initialChoices[opt.optionName] = opt.choices as Record<string, number>;
          }
        });
        setSelectedChoices(initialChoices);
      }
    }
  }, [isEditMode, cartItemToEdit]);

  // Handle mounting for portal (SSR safety)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate wizard steps dynamically based on item options
  // Menu items first, then menu categories, then additions
  const hasOptions = item.options && item.options.length > 0;
  const steps = useMemo(() => {
    const baseSteps = ['overview'];
    if (hasOptions && item.options) {
      // Separate menu items, menu categories and additions
      const menuItems = item.options.filter(opt => opt.sourceType === 'menuItem' && opt.choices && opt.choices.length > 0);
      const menuCategories = item.options.filter(opt => opt.sourceType === 'menuCategory' && opt.choices && opt.choices.length > 0);
      const additions = item.options.filter(opt => opt.sourceType === 'addition' && opt.choices && opt.choices.length > 0);
      
      // Add menu items first
      menuItems.forEach((_, idx) => {
        baseSteps.push(`menuItem-${idx}`);
      });
      
      // Then add menu categories
      menuCategories.forEach((_, idx) => {
        baseSteps.push(`menuCategory-${idx}`);
      });
      
      // Then add additions
      additions.forEach((_, idx) => {
        baseSteps.push(`addition-${idx}`);
      });
    }
    baseSteps.push('customize', 'review');
    return baseSteps;
  }, [hasOptions, item.options]);

  // Check scroll position and update button visibility
  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isScrollable = container.scrollHeight > container.clientHeight;
    const scrollTop = container.scrollTop;
    const scrollBottom = container.scrollHeight - container.clientHeight - scrollTop;

    setShowScrollButtons(isScrollable && (steps[currentStep] === 'overview' || steps[currentStep] === 'review'));
    setCanScrollUp(scrollTop > 20);
    setCanScrollDown(scrollBottom > 20);
  }, [currentStep, steps]);

  // Scroll to top when modal opens or step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Check scroll after content loads
    setTimeout(checkScroll, 100);
  }, [currentStep, checkScroll]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, steps]);

  // Scroll handler functions
  const scrollUp = () => {
    scrollContainerRef.current?.scrollBy({ top: -300, behavior: 'smooth' });
  };

  const scrollDown = () => {
    scrollContainerRef.current?.scrollBy({ top: 300, behavior: 'smooth' });
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    // Save original overflow style
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock scroll and hide scrollbar
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    // Cleanup: restore scroll when modal closes
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // Select a choice (starts with quantity 1)
  const selectChoice = (optionName: string, choice: OptionChoice, optionType: 'radio' | 'checkbox', maxSelection?: number) => {
    setSelectedChoices((prev) => {
      const currentChoices = prev[optionName] || {};
      
      if (optionType === 'radio') {
        // For radio, replace with the new choice (quantity = 1)
        return { ...prev, [optionName]: { [choice.name]: 1 } };
      } else {
        // For checkbox, check if we can add this choice
        const totalQuantity = Object.values(currentChoices).reduce((sum, qty) => sum + qty, 0);
        
        if (choice.name in currentChoices) {
          // Already selected, skip (user should use increment button instead)
          return prev;
        }
        
        // Check if we've reached the max selection limit
        if (maxSelection && totalQuantity >= maxSelection) {
          return prev;
        }
        
        return { ...prev, [optionName]: { ...currentChoices, [choice.name]: 1 } };
      }
    });
  };

  // Increment quantity for a choice
  const incrementChoice = (optionName: string, choiceName: string, maxSelection?: number) => {
    setSelectedChoices((prev) => {
      const currentChoices = prev[optionName] || {};
      const totalQuantity = Object.values(currentChoices).reduce((sum, qty) => sum + qty, 0);
      
      // Check max selection limit
      if (maxSelection && totalQuantity >= maxSelection) {
        return prev;
      }
      
      return {
        ...prev,
        [optionName]: {
          ...currentChoices,
          [choiceName]: (currentChoices[choiceName] || 0) + 1
        }
      };
    });
  };

  // Decrement quantity for a choice (removes if quantity becomes 0)
  const decrementChoice = (optionName: string, choiceName: string) => {
    setSelectedChoices((prev) => {
      const currentChoices = prev[optionName] || {};
      const currentQty = currentChoices[choiceName] || 0;
      
      if (currentQty <= 1) {
        // Remove the choice
        const newChoices = { ...currentChoices };
        delete newChoices[choiceName];
        return { ...prev, [optionName]: newChoices };
      }
      
      return {
        ...prev,
        [optionName]: {
          ...currentChoices,
          [choiceName]: currentQty - 1
        }
      };
    });
  };

  // Toggle choice (for backward compatibility with click behavior)
  const toggleChoice = (optionName: string, choice: OptionChoice, optionType: 'radio' | 'checkbox', maxSelection?: number) => {
    setSelectedChoices((prev) => {
      const currentChoices = prev[optionName] || {};
      
      if (optionType === 'radio') {
        return { ...prev, [optionName]: { [choice.name]: 1 } };
      } else {
        if (choice.name in currentChoices) {
          // Already selected - remove it
          const newChoices = { ...currentChoices };
          delete newChoices[choice.name];
          return { ...prev, [optionName]: newChoices };
        } else {
          // Not selected - try to add it
          const totalQuantity = Object.values(currentChoices).reduce((sum, qty) => sum + qty, 0);
          if (maxSelection && totalQuantity >= maxSelection) {
            return prev;
          }
          return { ...prev, [optionName]: { ...currentChoices, [choice.name]: 1 } };
        }
      }
    });
  };

  const calculateTotalPrice = () => {
    let optionsPrice = 0;
    
    if (item.options) {
      item.options.forEach((option) => {
        const selectedForOption = selectedChoices[option.name] || {};
        Object.entries(selectedForOption).forEach(([choiceName, qty]) => {
          const choice = option.choices.find((c) => c.name === choiceName);
          if (choice) {
            optionsPrice += choice.price * qty; // Multiply by quantity
          }
        });
      });
    }
    
    return (item.price + optionsPrice) * quantity;
  };

  const canProceed = () => {
    // Check if required options are selected for current option step
    const currentStepValue = steps[currentStep];
    
    if (currentStepValue?.startsWith('menuItem-') && item.options) {
      const menuItemIndex = parseInt(currentStepValue.split('-')[1], 10);
      const menuItems = item.options.filter(opt => opt.sourceType === 'menuItem' && opt.choices && opt.choices.length > 0);
      const currentOption = menuItems[menuItemIndex];
      if (currentOption?.required) {
        const selectedForOption = selectedChoices[currentOption.name] || {};
        return Object.keys(selectedForOption).length > 0;
      }
    }
    
    if (currentStepValue?.startsWith('menuCategory-') && item.options) {
      const categoryIndex = parseInt(currentStepValue.split('-')[1], 10);
      const menuCategories = item.options.filter(opt => opt.sourceType === 'menuCategory' && opt.choices && opt.choices.length > 0);
      const currentOption = menuCategories[categoryIndex];
      if (currentOption?.required) {
        const selectedForOption = selectedChoices[currentOption.name] || {};
        return Object.keys(selectedForOption).length > 0;
      }
    }
    
    if (currentStepValue?.startsWith('addition-') && item.options) {
      const additionIndex = parseInt(currentStepValue.split('-')[1], 10);
      const additions = item.options.filter(opt => opt.sourceType === 'addition' && opt.choices && opt.choices.length > 0);
      const currentOption = additions[additionIndex];
      if (currentOption?.required) {
        const selectedForOption = selectedChoices[currentOption.name] || {};
        return Object.keys(selectedForOption).length > 0;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddToCart = () => {
    let optionsPrice = 0;
    const selectedOptionsList: SelectedOption[] = [];
    const menuItemsList: OrderMenuItem[] = [];
    const menuCategoryGroups: Record<string, any> = {};
    const additionsList: Addition[] = [];
    
    if (item.options) {
      item.options.forEach((option) => {
        const selectedForOption = selectedChoices[option.name] || {};
        if (Object.keys(selectedForOption).length > 0) {
          let additionalPrice = 0;
          Object.entries(selectedForOption).forEach(([choiceName, qty]) => {
            const choice = option.choices.find((c) => c.name === choiceName);
            if (choice) {
              additionalPrice += choice.price * qty;
              
              if (option.sourceType === 'menuItem') {
                // Add to menu items list
                menuItemsList.push({
                  ref: choice.ref || choice.id || choiceName,
                  title: choiceName,
                  extra: 0,
                  quantity: qty,
                  price: {
                    unit_price: {
                      amount: Math.round(choice.price * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${choice.price.toFixed(2)} EUR`
                    },
                    total_price: {
                      amount: Math.round(choice.price * qty * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${(choice.price * qty).toFixed(2)} EUR`
                    }
                  }
                } as OrderMenuItem);
              } else if (option.sourceType === 'menuCategory') {
                // Group menuCategorys by category
                const categoryRef = choice.categoryRef || choice.categoryId || option.name;
                if (!menuCategoryGroups[option.name]) {
                  menuCategoryGroups[option.name] = {
                    ref: categoryRef,
                    name: option.name,
                    items: []
                  };
                }
                menuCategoryGroups[option.name].items.push({
                  ref: choice.ref || choice.id || choice.name,
                  name: choiceName,
                  qty: qty,
                  price: {
                    unit_price: {
                      amount: Math.round(choice.price * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${choice.price.toFixed(2)} EUR`
                    },
                    total_price: {
                      amount: Math.round(choice.price * qty * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${(choice.price * qty).toFixed(2)} EUR`
                    }
                  }
                });
              } else if (option.sourceType === 'addition') {
                const additionRef = Number(choice.ref || choice.id || Math.floor(Math.random() * 10000));
                additionsList.push({
                  ref: additionRef,
                  title: choiceName,
                  quantity: qty,
                  price: {
                    unit_price: {
                      amount: Math.round(choice.price * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${choice.price.toFixed(2)} EUR`
                    },
                    total_price: {
                      amount: Math.round(choice.price * qty * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${(choice.price * qty).toFixed(2)} EUR`
                    }
                  }
                } as Addition);
              } else {
                menuItemsList.push({
                  ref: choice.name,
                  title: choiceName,
                  extra: Math.round(choice.price * 100),
                  quantity: qty,
                  price: {
                    unit_price: {
                      amount: Math.round(choice.price * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${choice.price.toFixed(2)} EUR`
                    },
                    total_price: {
                      amount: Math.round(choice.price * qty * 100),
                      currency_code: 'EUR',
                      formatted_amount: `${(choice.price * qty).toFixed(2)} EUR`
                    }
                  }
                } as OrderMenuItem);
              }
            }
          });
          
          selectedOptionsList.push({
            optionName: option.name,
            choices: selectedForOption,
            additionalPrice,
          });
          
          optionsPrice += additionalPrice;
        }
      });
    }
    
    const finalPrice = item.price + optionsPrice;
    
    const menuCategoryList = Object.entries(menuCategoryGroups).flatMap(([categoryName, group]) => 
      group.items.map((item: any) => ({
        ref: String(item.ref),
        title: item.name,
        category_ref: String(group.ref),
        category_title: categoryName,
        quantity: item.qty,
        price: item.price
      }))
    );
    
    const cartItem = {
      id: isEditMode ? cartItemToEdit.id : `${item.id}-${Date.now()}`,
      ref: item.id,
      menuItemId: item.id,
      name: item.name,
      description: item.description,
      basePrice: item.price,
      finalPrice: finalPrice,
      quantity: quantity,
      image: item.image,
      selectedOptions: selectedOptionsList,
      specialInstructions: specialInstructions || undefined,
      type: ('category' in item && ['appetizers', 'mains', 'desserts'].includes(item.category)) ? 'food' as const : 'drink' as const,
      menuItems: menuItemsList.length > 0 ? menuItemsList : undefined,
      menuCategorys: menuCategoryList.length > 0 ? menuCategoryList : undefined,
      additions: additionsList.length > 0 ? additionsList : undefined,
    };
    
    if (isEditMode) {
      updateCartItem(cartItemToEdit.id, cartItem);
    } else {
      addToCart(cartItem);
    }
    onClose();
  };

  // Don't render on server or before mount
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 z-[100] animate-fade-in">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-20 lg:right-24 z-30 w-16 h-16 bg-red-500 dark:bg-red-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-red-600 dark:hover:bg-red-700 active:scale-95 active:bg-red-700 dark:active:bg-red-800 transition-all duration-200"
        aria-label="Close"
      >
        <X className="w-8 h-8 text-white transition-colors duration-200" />
      </button>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 z-20">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <button
              onClick={() => setCurrentStep(index)}
              disabled={index > currentStep}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                index < currentStep 
                  ? 'bg-primary-500 border-primary-500 cursor-pointer hover:scale-110 active:scale-95' 
                  : index === currentStep 
                  ? 'bg-white dark:bg-gray-800 border-primary-500 scale-110 cursor-default' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50'
              }`}
              aria-label={`Go to step ${index + 1}`}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <span className={`text-sm font-bold ${
                  index === currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {index + 1}
                </span>
              )}
            </button>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 rounded-full transition-all ${
                index < currentStep ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Vertical Scroll Buttons */}
      {showScrollButtons && (
        <>
          {canScrollUp && (
            <button
              onClick={scrollUp}
              className="fixed top-28 right-6 z-30 w-14 h-14 bg-primary-500 dark:bg-primary-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-primary-600 dark:hover:bg-primary-700 active:scale-95 transition-all duration-200"
              aria-label="Scroll up"
            >
              <ChevronUp className="w-8 h-8 text-white" />
            </button>
          )}
          {canScrollDown && (
            <button
              onClick={scrollDown}
              className="fixed bottom-28 right-6 z-30 w-14 h-14 bg-primary-500 dark:bg-primary-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-primary-600 dark:hover:bg-primary-700 active:scale-95 transition-all duration-200"
              aria-label="Scroll down"
            >
              <ChevronDown className="w-8 h-8 text-white" />
            </button>
          )}
        </>
      )}

      {/* View Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={`fixed top-1/2 -translate-y-1/2 right-6 z-30 flex flex-col items-center justify-center w-16 h-16 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 ${
          cart.length > 0
            ? 'bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 hover:from-green-600 hover:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800'
            : 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 hover:from-gray-500 hover:to-gray-600'
        }`}
        aria-label="View cart"
        title={t('viewCart')}
      >
        <ShoppingCart className="w-7 h-7 text-white" strokeWidth={2.5} />
        
        {/* Item Count Badge */}
        {cart.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800">
            <span className="text-xs font-bold">{cart.length}</span>
          </div>
        )}
        
        {/* Total Price Label */}
        {cart.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-lg border-2 border-green-500 dark:border-green-400 whitespace-nowrap">
            <span className="text-xs font-bold text-green-700 dark:text-green-300">
              {formatPrice(cartSummary.total)}
            </span>
          </div>
        )}
      </button>

      {/* Main Content */}
      <div ref={scrollContainerRef} className="h-full pt-24 pb-32 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Step 1: Overview */}
          {steps[currentStep] === 'overview' && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">{item.name}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{item.description}</p>
              </div>
              <div className="relative w-full max-w-2xl mx-auto aspect-[16/9] max-h-[300px] rounded-2xl overflow-hidden shadow-2xl">
                <OptimizedImage
                  src={getSafeImageUrl(item.image)}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
              <div className="text-center mt-4">
                <div className="inline-block bg-white dark:bg-gray-800 rounded-xl shadow-lg px-6 py-4">
                  {hasOptions && (
                    <p className="text-gray-600 dark:text-gray-400 text-base mb-1">{t('base_price')}</p>
                  )}
                  <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(item.price)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items Selection Step */}
          {steps[currentStep]?.startsWith('menuItem-') && item.options && (
            <div className="animate-fade-in">
              {(() => {
                const menuItemIndex = parseInt(steps[currentStep].split('-')[1], 10);
                const menuItems = item.options.filter(opt => opt.sourceType === 'menuItem' && opt.choices && opt.choices.length > 0);
                const option = menuItems[menuItemIndex];
                if (!option) return null;
                
                const choicesWithQty = selectedChoices[option.name] || {};
                const selectedCount = Object.values(choicesWithQty).reduce((sum, qty) => sum + qty, 0);
                const isMaxReached = !!(option.maxSelection && selectedCount >= option.maxSelection);
                
                return (
                  <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                        {t('step')} {currentStep + 1} / {steps.length}
                      </div>
                      
                      {/* Dynamic Type Badge */}
                      <div className={`inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 uppercase tracking-widest shadow-lg transform transition-all ${
                        option.sourceType === 'menuItem'
                          ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-700 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-600'
                          : option.sourceType === 'menuCategory'
                          ? 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600'
                          : 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-600'
                      }`}>
                        {option.sourceType === 'menuItem' && `🍽️ ${t('main_items')}`}
                        {option.sourceType === 'menuCategory' && `📦 ${t('categories')}`}
                        {option.sourceType === 'addition' && `✨ ${t('extras')}`}
                      </div>
                      
                      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3 relative inline-block">
                        {option.name || 'Unnamed Option'}
                        {/* Animated underline */}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-300 ${
                          option.sourceType === 'menuItem'
                            ? 'w-24 bg-gradient-to-r from-amber-500 to-yellow-500'
                            : option.sourceType === 'menuCategory'
                            ? 'w-24 bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'w-24 bg-gradient-to-r from-purple-500 to-pink-500'
                        }`} />
                      </h2>
                      
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        {option.required && (
                          <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-sm font-semibold border-2 border-red-300 dark:border-red-600 shadow-md">
                            <span className="text-lg">✓</span> {t('required')}
                          </div>
                        )}
                        
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-600">
                          <span className="text-lg">
                            {option.type === 'radio' ? '◉' : '◻'}
                          </span>
                          {option.type === 'radio' 
                            ? t('select_one')
                            : option.maxSelection 
                            ? `${t('select_multiple')} (${t('up_to')} ${option.maxSelection})`
                            : t('select_multiple')
                          }
                        </div>
                      </div>
                    </div>

                    {/* Menu Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {option.choices.map((choice, choiceIndex) => {
                        const choiceQty = choicesWithQty[choice.name] || 0;
                        const isSelected = choiceQty > 0;
                        
                        // Determine colors based on source type
                        const getTypeStyles = () => {
                          if (option.sourceType === 'menuItem') {
                            return {
                              selectedRing: 'ring-amber-500',
                              selectedGradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30',
                              borderHover: 'group-hover:border-amber-400',
                              imageBorder: 'border-amber-300 dark:border-amber-600',
                            };
                          } else if (option.sourceType === 'menuCategory') {
                            return {
                              selectedRing: 'ring-blue-500',
                              selectedGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30',
                              borderHover: 'group-hover:border-blue-400',
                              imageBorder: 'border-blue-300 dark:border-blue-600',
                            };
                          } else {
                            return {
                              selectedRing: 'ring-purple-500',
                              selectedGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
                              borderHover: 'group-hover:border-purple-400',
                              imageBorder: 'border-purple-300 dark:border-purple-600',
                            };
                          }
                        };
                        
                        const typeStyles = getTypeStyles();
                        
                        return (
                          <div
                            key={choiceIndex}
                            onClick={() => toggleChoice(option.name, choice, option.type, option.maxSelection)}
                            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full cursor-pointer backdrop-blur-sm border-4 ${
                              isSelected
                                ? `ring-4 ${typeStyles.selectedRing} bg-gradient-to-br ${typeStyles.selectedGradient} shadow-2xl scale-105 border-transparent`
                                : `bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl hover:scale-102 border-gray-200 dark:border-gray-700 ${typeStyles.borderHover}`
                            }`}
                          >
                            {/* Selection Indicator with Quantity Badge */}
                            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                              {option.type === 'radio' ? (
                                <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all shadow-lg transform ${
                                  isSelected 
                                    ? option.sourceType === 'menuItem'
                                      ? 'border-amber-500 bg-amber-500 scale-125' 
                                      : option.sourceType === 'menuCategory'
                                      ? 'border-blue-500 bg-blue-500 scale-125'
                                      : 'border-purple-500 bg-purple-500 scale-125'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {isSelected && (
                                    <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                                  )}
                                </div>
                              ) : (
                                <div className={`w-8 h-8 rounded-lg border-3 flex items-center justify-center transition-all shadow-lg transform ${
                                  isSelected 
                                    ? option.sourceType === 'menuItem'
                                      ? 'border-amber-500 bg-amber-500 scale-125' 
                                      : option.sourceType === 'menuCategory'
                                      ? 'border-blue-500 bg-blue-500 scale-125'
                                      : 'border-purple-500 bg-purple-500 scale-125'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {isSelected && <Check className="w-5 h-5 text-white" />}
                                </div>
                              )}
                              
                              {isSelected && choiceQty > 0 && (
                                <div className={`text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 ${
                                  option.sourceType === 'menuItem'
                                    ? 'bg-amber-500'
                                    : option.sourceType === 'menuCategory'
                                    ? 'bg-blue-500'
                                    : 'bg-purple-500'
                                }`}>
                                  {choiceQty}
                                </div>
                              )}
                            </div>

                            {/* Thumbnail Image Container */}
                            <div className={`relative w-full flex-shrink-0 h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 overflow-hidden border-b-4 transition-all ${
                              isSelected
                                ? option.sourceType === 'menuItem'
                                  ? 'border-amber-400 dark:border-amber-600'
                                  : option.sourceType === 'menuCategory'
                                  ? 'border-blue-400 dark:border-blue-600'
                                  : 'border-purple-400 dark:border-purple-600'
                                : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600'
                            }`}>
                              {choice.image ? (
                                <OptimizedImage
                                  src={getSafeImageUrl(choice.image)}
                                  alt={choice.name}
                                  fill
                                  className="object-cover group-hover:scale-125 transition-transform duration-500"
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                  <span className="text-4xl">🍽️</span>
                                </div>
                              )}
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              {/* Name */}
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2">
                                  {choice.name}
                                </h3>
                              </div>

                              {/* Price Badge */}
                              {choice.price > 0 && (
                                <div className={`rounded-lg p-2 mt-auto bg-gradient-to-r ${
                                  option.sourceType === 'menuItem'
                                    ? 'from-amber-100 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/40'
                                    : option.sourceType === 'menuCategory'
                                    ? 'from-blue-100 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40'
                                    : 'from-purple-100 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40'
                                }`}>
                                  <p className={`font-bold text-center ${
                                    option.sourceType === 'menuItem'
                                      ? 'text-amber-600 dark:text-amber-300'
                                      : option.sourceType === 'menuCategory'
                                      ? 'text-blue-600 dark:text-blue-300'
                                      : 'text-purple-600 dark:text-purple-300'
                                  }`}>
                                    +{formatPrice(choice.price)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Quantity Controls for Checkbox */}
                            {option.type === 'checkbox' && isSelected && (
                              <div className={`border-t px-4 py-3 flex items-center justify-center gap-3 transition-colors ${
                                option.sourceType === 'menuItem'
                                  ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                                  : option.sourceType === 'menuCategory'
                                  ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
                              }`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    decrementChoice(option.name, choice.name);
                                  }}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                                    option.sourceType === 'menuItem'
                                      ? 'bg-amber-300 dark:bg-amber-600 hover:bg-amber-400 dark:hover:bg-amber-500'
                                      : option.sourceType === 'menuCategory'
                                      ? 'bg-blue-300 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500'
                                      : 'bg-purple-300 dark:bg-purple-600 hover:bg-purple-400 dark:hover:bg-purple-500'
                                  }`}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-4 h-4 text-white" />
                                </button>
                                <span className="text-lg font-bold text-gray-800 dark:text-white min-w-[2rem] text-center">
                                  {choiceQty}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    incrementChoice(option.name, choice.name, option.maxSelection);
                                  }}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                                    option.sourceType === 'menuItem'
                                      ? 'bg-amber-500 hover:bg-amber-600'
                                      : option.sourceType === 'menuCategory'
                                      ? 'bg-blue-500 hover:bg-blue-600'
                                      : 'bg-purple-500 hover:bg-purple-600'
                                  }`}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Items Summary */}
                    {Object.keys(choicesWithQty).length > 0 && (
                      <div className={`bg-gradient-to-br rounded-2xl p-6 mb-8 border-2 ${
                        option.sourceType === 'menuItem'
                          ? 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700'
                          : option.sourceType === 'menuCategory'
                          ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700'
                          : 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg ${
                            option.sourceType === 'menuItem'
                              ? 'bg-amber-500'
                              : option.sourceType === 'menuCategory'
                              ? 'bg-blue-500'
                              : 'bg-purple-500'
                          }`}>
                            <ShoppingCart className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {t('added_to_cart')}
                          </h3>
                        </div>
                        
                        <div className="space-y-3">
                          {option.choices.map((choice) => {
                            const qty = choicesWithQty[choice.name];
                            if (!qty) return null;
                            
                            return (
                              <div key={choice.name} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3">
                                {/* Item Image */}
                                {choice.image && (
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                                    <OptimizedImage
                                      src={getSafeImageUrl(choice.image)}
                                      alt={choice.name}
                                      fill
                                      className="object-cover"
                                      sizes="64px"
                                    />
                                  </div>
                                )}
                                
                                {/* Item Details */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">
                                    {choice.name}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {qty} × {formatPrice(choice.price)}
                                  </p>
                                </div>
                                
                                {/* Total Price */}
                                <div className="flex flex-col items-end">
                                  <p className={`text-lg font-bold ${
                                    option.sourceType === 'menuItem'
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : option.sourceType === 'menuCategory'
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-purple-600 dark:text-purple-400'
                                  }`}>
                                    +{formatPrice(choice.price * qty)}
                                  </p>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({qty}x)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Total Additional Price */}
                        <div className={`border-t-2 mt-4 pt-4 ${
                          option.sourceType === 'menuItem'
                            ? 'border-amber-200 dark:border-amber-700'
                            : option.sourceType === 'menuCategory'
                            ? 'border-blue-200 dark:border-blue-700'
                            : 'border-purple-200 dark:border-purple-700'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-gray-700 dark:text-gray-300">
                              {t('total_extras')}
                            </span>
                            <span className={`text-2xl font-bold ${
                              option.sourceType === 'menuItem'
                                ? 'text-amber-600 dark:text-amber-400'
                                : option.sourceType === 'menuCategory'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-purple-600 dark:text-purple-400'
                            }`}>
                              +{formatPrice(
                                Object.entries(choicesWithQty).reduce((sum, [choiceName, qty]) => {
                                  const choice = option.choices.find(c => c.name === choiceName);
                                  return sum + (choice ? choice.price * qty : 0);
                                }, 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 2+: Individual Option Steps - Menu Categories */}
          {steps[currentStep]?.startsWith('menuCategory-') && item.options && (
            <div className="animate-fade-in">
              {(() => {
                const categoryIndex = parseInt(steps[currentStep].split('-')[1], 10);
                const menuCategories = item.options.filter(opt => opt.sourceType === 'menuCategory' && opt.choices && opt.choices.length > 0);
                const option = menuCategories[categoryIndex];
                if (!option) return null;
                
                const choicesWithQty = selectedChoices[option.name] || {};
                const selectedCount = Object.values(choicesWithQty).reduce((sum, qty) => sum + qty, 0);
                const isMaxReached = !!(option.maxSelection && selectedCount >= option.maxSelection);
                
                return (
                  <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                        {t('step')} {currentStep + 1} / {steps.length}
                      </div>
                      
                      {/* Dynamic Type Badge */}
                      <div className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 uppercase tracking-widest shadow-lg transform transition-all bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600">
                        📦 {t('categories')}
                      </div>
                      
                      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3 relative inline-block">
                        {option.name || 'Unnamed Option'}
                        {/* Animated underline */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 rounded-full w-24 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300" />
                      </h2>
                      
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        {option.required && (
                          <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-sm font-semibold border-2 border-red-300 dark:border-red-600 shadow-md">
                            <span className="text-lg">✓</span> {t('required')}
                          </div>
                        )}
                        
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-600">
                          <span className="text-lg">
                            {option.type === 'radio' ? '◉' : '◻'}
                          </span>
                          {option.type === 'radio' 
                            ? t('select_one')
                            : option.maxSelection 
                            ? `${t('select_multiple')} (${t('up_to')} ${option.maxSelection})`
                            : t('select_multiple')
                          }
                        </div>

                        {option.type === 'checkbox' && (
                          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold border border-blue-300 dark:border-blue-600">
                            <span className="text-lg">✓</span>
                            {selectedCount} / {option.maxSelection || option.choices.length} {t('selected')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Option Choices Grid with Thumbnails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {option.choices.map((choice, choiceIndex) => {
                        const choiceQty = choicesWithQty[choice.name] || 0;
                        const isSelected = choiceQty > 0;
                        const isOptionMaxReached = !!(option.maxSelection && selectedCount >= option.maxSelection && choiceQty === 0);
                        
                        return (
                          <div
                            key={choiceIndex}
                            onClick={() => !isOptionMaxReached && toggleChoice(option.name, choice, option.type, option.maxSelection)}
                            className={`group relative rounded-xl overflow-hidden transition-all duration-300 flex flex-col items-center justify-between gap-3 p-4 h-full cursor-pointer ${
                              isOptionMaxReached 
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-xl hover:scale-105'
                            } ${
                              isSelected
                                ? 'ring-3 ring-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                                : 'bg-white dark:bg-gray-800 shadow-md'
                            }`}
                          >
                            {/* Selection Indicator - Top Right */}
                            <div className="absolute top-3 right-3 z-10">
                              {option.type === 'radio' ? (
                                <div className={`w-7 h-7 rounded-full border-3 flex items-center justify-center transition-all shadow-md ${
                                  isSelected 
                                    ? 'border-primary-500 bg-primary-500' 
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {isSelected && (
                                    <div className="w-3.5 h-3.5 rounded-full bg-white" />
                                  )}
                                </div>
                              ) : (
                                <div className={`w-7 h-7 rounded border-3 flex items-center justify-center transition-all shadow-md ${
                                  isSelected 
                                    ? 'border-primary-500 bg-primary-500' 
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                              )}
                            </div>

                            {/* Thumbnail Image - Full Width */}
                            <div className="w-full">
                              {choice.image && (
                                <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                                  <OptimizedImage
                                    src={getSafeImageUrl(choice.image)}
                                    alt={choice.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    onLoad={() => console.log('✅ Image loaded:', choice.image)}
                                    onError={() => console.error('❌ Image failed to load:', choice.image)}
                                  />
                                </div>
                              )}
                              {!choice.image && (
                                <div className="relative w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                  <div className="text-gray-400 dark:text-gray-500 text-center">
                                    <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                    <span className="text-xs font-medium">{t('no_image')}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Content Section - Bottom */}
                            <div className="w-full text-center">
                              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                                {choice.name || 'Unnamed Option'}
                              </h3>
                              <div className={`text-sm font-bold transition-colors mb-3 ${
                                isSelected 
                                  ? 'text-primary-600 dark:text-primary-400' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {choice.price > 0 ? `+${formatPrice(choice.price)}` : <span className="text-green-600 dark:text-green-400">{t('free')}</span>}
                              </div>
                              
                              {/* Quantity Controls for Checkbox Options with Per-Choice Quantity Enabled */}
                              {option.type === 'checkbox' && option.allowPerChoiceQuantity && (
                                isSelected ? (
                                  // Show quantity with +/- buttons when selected
                                  <div className="flex items-center justify-center gap-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        decrementChoice(option.name, choice.name);
                                      }}
                                      className="w-6 h-6 bg-primary-500 hover:bg-primary-600 dark:hover:bg-primary-400 active:scale-90 text-white rounded flex items-center justify-center transition-all text-sm font-bold"
                                      title="Decrease quantity"
                                    >
                                      −
                                    </button>
                                    <span className="w-6 text-center font-bold text-primary-700 dark:text-primary-300">
                                      {choiceQty}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        incrementChoice(option.name, choice.name, option.maxSelection);
                                      }}
                                      disabled={!!(option.maxSelection && selectedCount >= option.maxSelection)}
                                      className="w-6 h-6 bg-primary-500 hover:bg-primary-600 dark:hover:bg-primary-400 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center justify-center transition-all text-sm font-bold"
                                      title="Increase quantity"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  // Show "Click to select" hint when not selected
                                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {t('click_to_select')}
                                  </div>
                                )
                              )}
                              
                              {/* Simple Selection Indicator for Checkbox Options WITHOUT Per-Choice Quantity */}
                              {option.type === 'checkbox' && !option.allowPerChoiceQuantity && (
                                isSelected ? (
                                  <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    ✓ {t('selected')}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {t('click_to_select')}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Empty State */}
                    {option.choices.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-lg text-gray-500 dark:text-gray-400">{t('no_options_available')}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 2+: Individual Option Steps - Additions */}
          {steps[currentStep]?.startsWith('addition-') && item.options && (
            <div className="animate-fade-in">
              {(() => {
                const additionIndex = parseInt(steps[currentStep].split('-')[1], 10);
                const additions = item.options.filter(opt => opt.sourceType === 'addition' && opt.choices && opt.choices.length > 0);
                const option = additions[additionIndex];
                if (!option) return null;
                
                const choicesWithQty = selectedChoices[option.name] || {};
                const selectedCount = Object.values(choicesWithQty).reduce((sum, qty) => sum + qty, 0);
                const isMaxReached = !!(option.maxSelection && selectedCount >= option.maxSelection);
                
                return (
                  <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                        {t('step')} {currentStep + 1} / {steps.length}
                      </div>
                      
                      {/* Dynamic Type Badge */}
                      <div className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 uppercase tracking-widest shadow-lg transform transition-all bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-600">
                        ✨ {t('extras')}
                      </div>
                      
                      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3 relative inline-block">
                        {option.name || 'Unnamed Option'}
                        {/* Animated underline */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 rounded-full w-24 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" />
                      </h2>
                      
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        {option.required && (
                          <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-sm font-semibold border-2 border-red-300 dark:border-red-600 shadow-md">
                            <span className="text-lg">✓</span> {t('required')}
                          </div>
                        )}
                        
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-600">
                          <span className="text-lg">
                            {option.type === 'radio' ? '◉' : '◻'}
                          </span>
                          {option.type === 'radio' 
                            ? t('select_one')
                            : option.maxSelection 
                            ? `${t('select_multiple')} (${t('up_to')} ${option.maxSelection})`
                            : t('select_multiple')
                          }
                        </div>

                        {option.type === 'checkbox' && (
                          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold border border-purple-300 dark:border-purple-600">
                            <span className="text-lg">✓</span>
                            {selectedCount} / {option.maxSelection || option.choices.length} {t('selected')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Option Choices Grid with Thumbnails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {option.choices.map((choice, choiceIndex) => {
                        const choiceQty = choicesWithQty[choice.name] || 0;
                        const isSelected = choiceQty > 0;
                        const isOptionMaxReached = !!(option.maxSelection && selectedCount >= option.maxSelection && choiceQty === 0);
                        
                        return (
                          <div
                            key={choiceIndex}
                            onClick={() => !isOptionMaxReached && toggleChoice(option.name, choice, option.type, option.maxSelection)}
                            className={`group relative rounded-xl overflow-hidden transition-all duration-300 flex flex-col items-center justify-between gap-3 p-4 h-full cursor-pointer ${
                              isOptionMaxReached 
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-xl hover:scale-105'
                            } ${
                              isSelected
                                ? 'ring-3 ring-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                                : 'bg-white dark:bg-gray-800 shadow-md'
                            }`}
                          >
                            {/* Selection Indicator - Top Right */}
                            <div className="absolute top-3 right-3 z-10">
                              {option.type === 'radio' ? (
                                <div className={`w-7 h-7 rounded-full border-3 flex items-center justify-center transition-all shadow-md ${
                                  isSelected 
                                    ? 'border-primary-500 bg-primary-500' 
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {isSelected && (
                                    <div className="w-3.5 h-3.5 rounded-full bg-white" />
                                  )}
                                </div>
                              ) : (
                                <div className={`w-7 h-7 rounded border-3 flex items-center justify-center transition-all shadow-md ${
                                  isSelected 
                                    ? 'border-primary-500 bg-primary-500' 
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                              )}
                            </div>

                            {/* Thumbnail Image - Full Width */}
                            <div className="w-full">
                              {choice.image && (
                                <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                                  <OptimizedImage
                                    src={getSafeImageUrl(choice.image)}
                                    alt={choice.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    onLoad={() => console.log('✅ Image loaded:', choice.image)}
                                    onError={() => console.error('❌ Image failed to load:', choice.image)}
                                  />
                                </div>
                              )}
                              {!choice.image && (
                                <div className="relative w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                  <div className="text-gray-400 dark:text-gray-500 text-center">
                                    <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                    <span className="text-xs font-medium">{t('no_image')}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Content Section - Bottom */}
                            <div className="w-full text-center">
                              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                                {choice.name || 'Unnamed Option'}
                              </h3>
                              <div className={`text-sm font-bold transition-colors mb-3 ${
                                isSelected 
                                  ? 'text-primary-600 dark:text-primary-400' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {choice.price > 0 ? `+${formatPrice(choice.price)}` : <span className="text-green-600 dark:text-green-400">{t('free')}</span>}
                              </div>
                              
                              {/* Quantity Controls for Checkbox Options with Per-Choice Quantity Enabled */}
                              {option.type === 'checkbox' && option.allowPerChoiceQuantity && (
                                isSelected ? (
                                  // Show quantity with +/- buttons when selected
                                  <div className="flex items-center justify-center gap-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        decrementChoice(option.name, choice.name);
                                      }}
                                      className="w-6 h-6 bg-primary-500 hover:bg-primary-600 dark:hover:bg-primary-400 active:scale-90 text-white rounded flex items-center justify-center transition-all text-sm font-bold"
                                      title="Decrease quantity"
                                    >
                                      −
                                    </button>
                                    <span className="w-6 text-center font-bold text-primary-700 dark:text-primary-300">
                                      {choiceQty}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        incrementChoice(option.name, choice.name, option.maxSelection);
                                      }}
                                      disabled={!!(option.maxSelection && selectedCount >= option.maxSelection)}
                                      className="w-6 h-6 bg-primary-500 hover:bg-primary-600 dark:hover:bg-primary-400 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center justify-center transition-all text-sm font-bold"
                                      title="Increase quantity"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  // Show "Click to select" hint when not selected
                                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {t('click_to_select')}
                                  </div>
                                )
                              )}
                              
                              {/* Simple Selection Indicator for Checkbox Options WITHOUT Per-Choice Quantity */}
                              {option.type === 'checkbox' && !option.allowPerChoiceQuantity && (
                                isSelected ? (
                                  <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    ✓ {t('selected')}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {t('click_to_select')}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Empty State */}
                    {option.choices.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-lg text-gray-500 dark:text-gray-400">{t('no_options_available')}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step: Customize (Quantity & Instructions) */}
          {steps[currentStep] === 'customize' && (
            <div className="animate-fade-in max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                  {t('step')} {currentStep + 1} / {steps.length}
                </div>
                <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                  {t('finalize_your_order')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {t('set_quantity_and_instructions')}
                </p>
              </div>

              {/* Quantity */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                  {t('quantity')}
                </h3>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-90 flex items-center justify-center transition-all shadow-lg"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                  </button>
                  <div className="text-center min-w-[100px]">
                    <div className="text-5xl font-bold text-primary-600 dark:text-primary-400">
                      {quantity}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-base mt-1">
                      {quantity === 1 ? t('item') : t('items')}
                    </div>
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-16 h-16 rounded-full bg-primary-500 hover:bg-primary-600 active:scale-90 flex items-center justify-center transition-all shadow-lg"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-8 h-8 text-white" />
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {t('special_instructions')}
                  </h3>
                  {isEditMode && cartItemToEdit?.specialInstructions && (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                      ✓ {t('preserved')}
                    </span>
                  )}
                </div>
                <KeyboardTextarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={t('special_instructions_placeholder')}
                  aria-label={t('special_instructions')}
                  className="w-full min-h-[150px] p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white text-base resize-none focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all"
                  maxLength={200}
                />
                <p className="text-right text-gray-500 dark:text-gray-400 mt-2 text-sm">
                  {specialInstructions.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Step: Review */}
          {steps[currentStep] === 'review' && (
            <div className="animate-fade-in max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                  {t('step')} {currentStep + 1} / {steps.length}
                </div>
                <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                  {t('review_your_order')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {t('check_before_adding')}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                  {/* Item Details with Image */}
                  <div className="flex items-start gap-4 mb-6">
                    {/* Item Image - Thumbnail */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-primary-200 dark:ring-primary-800">
                      <OptimizedImage
                        src={getSafeImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </div>
                    
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{item.name}</h3>
                      <p className="text-base text-gray-600 dark:text-gray-300">{item.description}</p>
                    </div>
                  </div>

                  {/* Selected Options */}
                  {item.options && Object.keys(selectedChoices).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{t('your_selections')}</h4>
                      <div className="space-y-2">
                        {item.options.map((option) => {
                          if (option.sourceType === 'menuItem') return null;
                          
                          const selectedForOption = selectedChoices[option.name] || {};
                          const entries = Object.entries(selectedForOption);
                          if (entries.length === 0) return null;
                          
                          return (
                            <div key={option.name} className="flex justify-between items-start bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                              <div className="flex-1">
                                <span className="text-base font-semibold text-gray-700 dark:text-gray-300">{option.name}:</span>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                                  {entries.map(([choiceName, qty], idx) => {
                                    const choice = option.choices.find(c => c.name === choiceName);
                                    return (
                                      <div key={idx} className="flex items-center gap-2">
                                        <span>• {qty}x {choiceName}</span>
                                        {choice && choice.price > 0 && (
                                          <span className="text-primary-600 dark:text-primary-400 font-semibold text-xs">
                                            +{formatPrice(choice.price * qty)}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {specialInstructions && (
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{t('special_instructions')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        {specialInstructions}
                      </p>
                    </div>
                  )}

                  {/* Quantity & Price */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-700 dark:text-gray-300">{t('quantity')}</span>
                      <span className="font-bold text-gray-800 dark:text-white">{quantity}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-700 dark:text-gray-300">{t('base_price')}</span>
                      <span className="font-bold text-gray-800 dark:text-white">{formatPrice(item.price)}</span>
                    </div>
                    {calculateTotalPrice() !== item.price * quantity && (
                      <div className="flex justify-between items-center text-base">
                        <span className="text-gray-700 dark:text-gray-300">{t('extras')}</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          +{formatPrice((calculateTotalPrice() - (item.price * quantity)) / quantity)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-2xl font-bold border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                      <span className="text-gray-800 dark:text-white">{t('total')}</span>
                      <span className="text-primary-600 dark:text-primary-400">{formatPrice(calculateTotalPrice())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 p-6 shadow-2xl z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-3 px-6 py-5 rounded-2xl text-xl font-bold transition-all ${
              currentStep === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
            {t('previous')}
          </button>

          {/* Step Info */}
          <div className="text-center flex-shrink-0">
            <div className="text-base text-gray-500 dark:text-gray-400">{t('step')}</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {currentStep + 1} / {steps.length}
            </div>
          </div>

          {/* Next/Add Button */}
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-3 px-6 py-5 rounded-2xl text-xl font-bold transition-all ${
                !canProceed()
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-lg'
              }`}
            >
              {t('next')}
              <ChevronRight className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-3 px-8 py-5 rounded-2xl text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:scale-95 transition-all shadow-xl"
            >
              <ShoppingCart className="w-6 h-6" />
              {isEditMode ? t('update_item') : t('add_to_cart')} - {formatPrice(calculateTotalPrice())}
            </button>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>,
    document.body
  );
}