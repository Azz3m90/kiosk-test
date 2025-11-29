'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { VirtualKeyboard } from '@/components/ui/VirtualKeyboard';
import { useKiosk } from '@/context/KioskContext';

interface KeyboardContextType {
  showKeyboard: (
    inputElement: HTMLInputElement | HTMLTextAreaElement,
    inputType?: 'text' | 'number' | 'email' | 'tel'
  ) => void;
  hideKeyboard: () => void;
  isKeyboardVisible: boolean;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const { currentLanguage, currentStep } = useKiosk();
  const [isVisible, setIsVisible] = useState(false);
  const [inputType, setInputType] = useState<'text' | 'number' | 'email' | 'tel'>('text');
  const [currentValue, setCurrentValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [fieldLabel, setFieldLabel] = useState<string>('');
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const targetCursorPositionRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  
  // Track rapid key presses for word-jump behavior
  const lastKeyPressRef = useRef<{key: string, timestamp: number, count: number}>({
    key: '',
    timestamp: 0,
    count: 0
  });
  const RAPID_PRESS_THRESHOLD = 500; // milliseconds

  // Close keyboard when step changes (handles reset scenario)
  useEffect(() => {
    if (isVisible) {
      setIsVisible(false);
      setCurrentValue('');
      setCursorPosition(0);
      setFieldLabel('');
      activeInputRef.current = null;
      targetCursorPositionRef.current = 0;
      isProcessingRef.current = false;
      lastKeyPressRef.current = { key: '', timestamp: 0, count: 0 };
    }
  }, [currentStep]);

  // Update field label when language changes
  useEffect(() => {
    if (isVisible && activeInputRef.current) {
      const input = activeInputRef.current;
      const label = 
        input.getAttribute('aria-label') ||
        input.getAttribute('placeholder') ||
        input.getAttribute('name') ||
        input.getAttribute('id') ||
        'field';
      setFieldLabel(label);
    }
  }, [currentLanguage, isVisible]);

  // Helper to reliably update cursor position
  const updateCursorPosition = useCallback((input: HTMLInputElement | HTMLTextAreaElement, position: number) => {
    if (!input || !document.contains(input)) return;

    // Keep track of our intended position
    targetCursorPositionRef.current = position;
    setCursorPosition(position);

    // Focus input if needed
    if (document.activeElement !== input) {
      input.focus();
    }

    // Set cursor position with multiple attempts for reliability
    const attempts = [0, 16, 32, 64, 128]; // Exponential backoff
    attempts.forEach(delay => {
      setTimeout(() => {
        if (input && document.contains(input)) {
          // Only update if we haven't had a newer cursor position request
          if (targetCursorPositionRef.current === position) {
            input.setSelectionRange(position, position);

            // For textareas, ensure cursor is visible
            if (input.tagName === 'TEXTAREA') {
              const textarea = input as HTMLTextAreaElement;
              const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 24;
              const textBeforeCursor = textarea.value.substring(0, position);
              const lines = textBeforeCursor.split('\n');
              const cursorTop = (lines.length - 1) * lineHeight;
              
              // Center the cursor in view if needed
              const visibleHeight = textarea.clientHeight;
              if (cursorTop < textarea.scrollTop || 
                  cursorTop > textarea.scrollTop + visibleHeight - lineHeight * 2) {
                textarea.scrollTop = Math.max(0, cursorTop - visibleHeight / 2);
              }
            }
          }
        }
      }, delay);
    });
  }, []);

  // Track input value and cursor changes
  useEffect(() => {
    if (!isVisible || !activeInputRef.current) return;

    const input = activeInputRef.current;
    let isUpdating = false;

    const handleInputUpdate = () => {
      if (isUpdating) return;
      isUpdating = true;
      
      const newValue = input.value;
      if (document.activeElement === input && input.selectionStart !== null) {
        updateCursorPosition(input, input.selectionStart);
      }
      
      setCurrentValue(prevValue => {
        if (prevValue !== newValue) {
          return newValue;
        }
        return prevValue;
      });
      
      requestAnimationFrame(() => {
        isUpdating = false;
      });
    };

    input.addEventListener('input', handleInputUpdate);
    input.addEventListener('click', handleInputUpdate);
    input.addEventListener('focus', handleInputUpdate);
    input.addEventListener('mouseup', handleInputUpdate);

    // Periodic sync for modals/portals
    const syncInterval = setInterval(() => {
      if (document.activeElement === input) {
        handleInputUpdate();
      }
    }, 100);

    return () => {
      input.removeEventListener('input', handleInputUpdate);
      input.removeEventListener('click', handleInputUpdate);
      input.removeEventListener('focus', handleInputUpdate);
      input.removeEventListener('mouseup', handleInputUpdate);
      clearInterval(syncInterval);
    };
  }, [isVisible, updateCursorPosition]);

  const showKeyboard = useCallback((
    inputElement: HTMLInputElement | HTMLTextAreaElement,
    type: 'text' | 'number' | 'email' | 'tel' = 'text'
  ) => {
    activeInputRef.current = inputElement;
    setInputType(type);
    setCurrentValue(inputElement.value);
    setIsVisible(true);

    const label = 
      inputElement.getAttribute('aria-label') ||
      inputElement.getAttribute('placeholder') ||
      inputElement.getAttribute('name') ||
      inputElement.getAttribute('id') ||
      'field';
    setFieldLabel(label);

    // Focus input and set initial cursor position
    inputElement.focus();
    const position = inputElement.selectionStart ?? inputElement.value.length;
    updateCursorPosition(inputElement, position);

    // Scroll input into view
    setTimeout(() => {
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [updateCursorPosition]);

  const hideKeyboard = useCallback(() => {
    setIsVisible(false);
    setCurrentValue('');
    setCursorPosition(0);
    setFieldLabel('');
    activeInputRef.current = null;
    targetCursorPositionRef.current = 0;
    isProcessingRef.current = false;
    lastKeyPressRef.current = { key: '', timestamp: 0, count: 0 };
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    const input = activeInputRef.current;
    if (!input) return;

    // Ensure input is focused FIRST before any operations
    if (document.activeElement !== input) {
      input.focus();
    }

    // Block overlapping operations for backspace/clear
    if ((key === 'Backspace' || key === 'Clear') && isProcessingRef.current) {
      setTimeout(() => handleKeyPress(key), 20);
      return;
    }

    // Get current state
    const start = targetCursorPositionRef.current;
    const end = start;
    const currentInputValue = input.value;
    
    let newValue = currentInputValue;
    let newCursorPosition = start;
    let shouldUpdateValue = true;

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      shouldUpdateValue = false;
      const now = Date.now();
      const lastPress = lastKeyPressRef.current;
      const isRapidPress = lastPress.key === key && 
                          (now - lastPress.timestamp) <= RAPID_PRESS_THRESHOLD &&
                          lastPress.count > 0;
      
      if (key === 'ArrowLeft' && start > 0) {
        if (isRapidPress && lastPress.count % 3 === 0 && currentInputValue.length > 3) {
          // Word-jump on every third rapid press
          let pos = start - 1;
          while (pos > 0 && /[\s\n\r.,!?;:'"()-]/.test(currentInputValue[pos])) pos--;
          while (pos > 0 && !/[\s\n\r.,!?;:'"()-]/.test(currentInputValue[pos - 1])) pos--;
          newCursorPosition = Math.max(0, pos);
        } else {
          newCursorPosition = Math.max(0, start - 1);
        }
        lastKeyPressRef.current = {
          key,
          timestamp: now,
          count: isRapidPress ? lastPress.count + 1 : 1
        };
      } else if (key === 'ArrowRight' && start < currentInputValue.length) {
        if (isRapidPress && lastPress.count % 3 === 0 && currentInputValue.length > 3) {
          // Word-jump on every third rapid press
          let pos = start;
          while (pos < currentInputValue.length && !/[\s\n\r.,!?;:'"()-]/.test(currentInputValue[pos])) pos++;
          while (pos < currentInputValue.length && /[\s\n\r.,!?;:'"()-]/.test(currentInputValue[pos])) pos++;
          newCursorPosition = Math.min(currentInputValue.length, pos);
        } else {
          newCursorPosition = Math.min(currentInputValue.length, start + 1);
        }
        lastKeyPressRef.current = {
          key,
          timestamp: now,
          count: isRapidPress ? lastPress.count + 1 : 1
        };
      } else {
        // Reset rapid press tracking at boundaries
        lastKeyPressRef.current = { key: '', timestamp: 0, count: 0 };
        return; // No change needed
      }
    } else {
      // Reset rapid press tracking for non-arrow keys
      lastKeyPressRef.current = { key: '', timestamp: 0, count: 0 };
      
      if (key === 'Backspace') {
        isProcessingRef.current = true;
        if (start === end && start > 0) {
          newValue = currentInputValue.slice(0, start - 1) + currentInputValue.slice(end);
          newCursorPosition = start - 1;
        } else {
          newValue = currentInputValue.slice(0, start) + currentInputValue.slice(end);
          newCursorPosition = start;
        }
      } else if (key === 'Clear') {
        isProcessingRef.current = true;
        newValue = '';
        newCursorPosition = 0;
      } else if (key === 'Enter') {
        input.blur();
        hideKeyboard();
        return;
      } else {
        newValue = currentInputValue.slice(0, start) + key + currentInputValue.slice(end);
        newCursorPosition = start + key.length;
      }
    }

    // Apply changes
    if (shouldUpdateValue) {
      // Update the input value
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        input.constructor.prototype,
        'value'
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, newValue);
        setCurrentValue(newValue);
        
        // Trigger React's synthetic event
        const inputEvent = new Event('input', { bubbles: true });
        Object.defineProperty(inputEvent, 'target', { writable: false, value: input });
        input.dispatchEvent(inputEvent);
        
        // Update cursor with the new position
        updateCursorPosition(input, newCursorPosition);
        
        // Clear processing flag after confirmed update
        setTimeout(() => {
          if (input.value === newValue) {
            isProcessingRef.current = false;
          }
        }, 50);
      }
      } else {
        // For arrow keys, be more aggressive with cursor updates
        const attempts = [0, 16, 32, 64, 100, 200]; // More frequent attempts
        attempts.forEach(delay => {
          setTimeout(() => {
            if (input && document.contains(input)) {
              // Refocus and update cursor if needed
              if (document.activeElement !== input) {
                input.focus();
              }
              input.setSelectionRange(newCursorPosition, newCursorPosition);
            }
          }, delay);
        });

        // Also update our state tracker
        updateCursorPosition(input, newCursorPosition);
      }
  }, [hideKeyboard, updateCursorPosition]);

  return (
    <KeyboardContext.Provider value={{ showKeyboard, hideKeyboard, isKeyboardVisible: isVisible }}>
      {children}
      {isVisible && activeInputRef.current && document.contains(activeInputRef.current) && (
        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          onClose={hideKeyboard}
          inputType={inputType}
          currentValue={currentValue}
          cursorPosition={cursorPosition}
          fieldLabel={fieldLabel}
          language={currentLanguage}
        />
      )}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}