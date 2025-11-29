'use client';

import { useRef, InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { useKeyboard } from '@/context/KeyboardContext';
import { Keyboard } from 'lucide-react';

interface KeyboardInputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputType?: 'text' | 'number' | 'email' | 'tel';
}

interface KeyboardTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const KeyboardInput = forwardRef<HTMLInputElement, KeyboardInputProps>(
  function KeyboardInput({ inputType = 'text', className = '', ...props }, forwardedRef) {
    const localRef = useRef<HTMLInputElement>(null);
    const inputRef = (forwardedRef as any) || localRef;
    const { showKeyboard } = useKeyboard();

    const handleFocus = () => {
      if (inputRef.current) {
        showKeyboard(inputRef.current, inputType);
      }
    };

    return (
      <div className="relative">
        <input
          ref={inputRef as any}
          type={inputType === 'number' ? 'text' : inputType}
          inputMode="none"
          onFocus={handleFocus}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault(); // Prevent default arrow key behavior
            }
          }}
          className={`${className} pr-12`}
          {...props}
        />
        <button
          type="button"
          onClick={handleFocus}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/50 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Show keyboard"
          tabIndex={-1}
        >
          <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </button>
      </div>
    );
  }
);

export function KeyboardTextarea({ className = '', ...props }: KeyboardTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showKeyboard } = useKeyboard();

  const handleFocus = () => {
    if (textareaRef.current) {
      showKeyboard(textareaRef.current, 'text');
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        inputMode="none"
        onFocus={handleFocus}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault(); // Prevent default arrow key behavior
          }
        }}
        className={`${className} pr-12`}
        {...props}
      />
      <button
        type="button"
        onClick={handleFocus}
        className="absolute right-3 top-3 w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/50 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Show keyboard"
        tabIndex={-1}
      >
        <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </button>
    </div>
  );
}