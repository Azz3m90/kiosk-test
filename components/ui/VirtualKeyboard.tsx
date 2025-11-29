'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Delete, Space, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, XCircle, CornerDownLeft } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Language } from '@/types';

export type KeyboardLayout = 'default' | 'numeric' | 'email';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  inputType?: 'text' | 'number' | 'email' | 'tel';
  currentValue: string;
  cursorPosition: number;
  fieldLabel?: string;
  language?: Language;
}

// Sound generation utility using Web Audio API
const playKeySound = (type: 'key' | 'delete' | 'clear' = 'key') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies and patterns for different key types
    if (type === 'key') {
      // Normal key: short, pleasant beep
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } else if (type === 'delete') {
      // Delete: lower tone
      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } else if (type === 'clear') {
      // Clear all: distinctive double beep
      oscillator.frequency.value = 400;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    }
  } catch (error) {
    // Silently fail if audio context is not supported
    console.log('Audio not supported');
  }
};

// QWERTY Layout for English (EN)
const QWERTY_EN_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['Z', 'X', 'C', 'V', 'B', 'N'],
];

// QWERTY Layout for Dutch (NL)
const QWERTY_NL_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['Z', 'X', 'C', 'V', 'B', 'N'],
  ['é', 'è', 'ë', 'ï', 'ö', 'ü', 'ñ', 'à'], // Dutch special characters
];

// QWERTY Layout for Spanish (ES)
const QWERTY_ES_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['Z', 'X', 'C', 'V', 'B', 'N'],
  ['á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú', 'ñ', 'Ñ', 'ü', 'Ü', '¿', '¡', '·'],
];

// QWERTY Layout for Italian (IT)
const QWERTY_IT_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['Z', 'X', 'C', 'V', 'B', 'N'],
  ['à', 'è', 'é', 'ì', 'ò', 'ù', 'À', 'È', 'É', 'Ì', 'Ò', 'Ù', '§', '°'],
];

// AZERTY Layout for French (FR)
const AZERTY_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['W', 'X', 'C', 'V', 'B', 'N'],
  ['é', 'è', 'ê', 'à', 'â', 'ù', 'û', 'ô', 'î', 'ï', 'ç', 'œ'], // French special characters
];

// QWERTZ Layout for German (DE)
const QWERTZ_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['Y', 'X', 'C', 'V', 'B', 'N'],
  ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü', '€', '§', '°'],
];

const NUMERIC_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0', '.', '-'],
];

const EMAIL_SPECIAL_KEYS = ['@', '.com', '.net', '.org'];

// Helper function to get keyboard layout based on language
const getKeyboardLayout = (language: Language) => {
  switch (language) {
    case 'fr':
      return AZERTY_LAYOUT;
    case 'de':
      return QWERTZ_LAYOUT;
    case 'nl':
      return QWERTY_NL_LAYOUT;
    case 'es':
      return QWERTY_ES_LAYOUT;
    case 'it':
      return QWERTY_IT_LAYOUT;
    case 'en':
    default:
      return QWERTY_EN_LAYOUT;
  }
};

export function VirtualKeyboard({ onKeyPress, onClose, inputType = 'text', currentValue, cursorPosition, fieldLabel, language = 'en' }: VirtualKeyboardProps) {
  const [isUpperCase, setIsUpperCase] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Get the appropriate keyboard layout based on language
  const CURRENT_LAYOUT = getKeyboardLayout(language);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleKeyPress = (key: string) => {
    let processedKey = key;
    
    // Play appropriate sound based on key type
    if (key === 'BACKSPACE') {
      playKeySound('delete');
      processedKey = 'Backspace';
    } else if (key === 'CLEAR') {
      playKeySound('clear');
      processedKey = 'Clear';
    } else if (key === 'SPACE') {
      playKeySound('key');
      processedKey = ' ';
    } else if (key === 'ARROW_LEFT') {
      playKeySound('key');
      processedKey = 'ArrowLeft';
    } else if (key === 'ARROW_RIGHT') {
      playKeySound('key');
      processedKey = 'ArrowRight';
    } else if (key === 'ENTER') {
      playKeySound('key');
      processedKey = 'Enter';
    } else if (key === 'SHIFT') {
      playKeySound('key');
      setIsUpperCase(!isUpperCase);
      return;
    } else if (!isUpperCase && key.length === 1 && key.match(/[A-Z]/)) {
      playKeySound('key');
      processedKey = key.toLowerCase();
    } else {
      // Normal character key (numbers, letters, special characters)
      playKeySound('key');
    }

    onKeyPress(processedKey);

    // Auto-shift after special characters or space
    if (['.', '!', '?', ' '].includes(processedKey) && currentValue.length > 0) {
      setIsUpperCase(true);
    }
  };

  if (!mounted) return null;

  const renderNumericKeyboard = () => (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Number Grid - 3x3 + special row - REDUCED HEIGHT */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {NUMERIC_LAYOUT.slice(0, 3).flat().map((key, index) => (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className="h-12 sm:h-14 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-xl sm:text-2xl font-bold text-gray-800 dark:text-white"
          >
            {key}
          </button>
        ))}
      </div>
      
      {/* 0 and special characters row - REDUCED HEIGHT */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {NUMERIC_LAYOUT[3].map((key, index) => (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className="h-12 sm:h-14 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-xl sm:text-2xl font-bold text-gray-800 dark:text-white"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Control buttons - better kiosk layout - REDUCED HEIGHT */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {/* Backspace - larger for easy access */}
        <button
          onClick={() => handleKeyPress('BACKSPACE')}
          className="col-span-2 h-10 sm:h-12 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-white font-semibold text-sm sm:text-base"
          title="Delete"
        >
          <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
        
        {/* Arrow navigation grouped */}
        <button
          onClick={() => handleKeyPress('ARROW_LEFT')}
          className="h-10 sm:h-12 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center text-white"
          title="Move Left"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={() => handleKeyPress('ARROW_RIGHT')}
          className="h-10 sm:h-12 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center text-white"
          title="Move Right"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        {/* Enter - prominent */}
        <button
          onClick={() => handleKeyPress('ENTER')}
          className="col-span-2 h-10 sm:h-12 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-white font-semibold text-sm sm:text-base"
          title="Enter"
        >
          <CornerDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Enter</span>
        </button>
      </div>

      {/* Clear button - separated to avoid accidental press */}
      <div className="grid grid-cols-1">
        <button
          onClick={() => handleKeyPress('CLEAR')}
          className="h-10 sm:h-12 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-white font-semibold"
          title="Clear All"
        >
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );

  const renderFullKeyboard = () => (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Number row - REDUCED HEIGHT */}
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {CURRENT_LAYOUT[0].map((key, index) => (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className="h-10 sm:h-12 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-base sm:text-lg font-bold text-gray-800 dark:text-white"
          >
            {key}
          </button>
        ))}
      </div>

      {/* First letter row - REDUCED HEIGHT */}
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {CURRENT_LAYOUT[1].map((key, index) => (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className="h-10 sm:h-12 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-base sm:text-lg font-bold text-gray-800 dark:text-white"
          >
            {isUpperCase ? key : key.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Second letter row - REDUCED HEIGHT */}
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {CURRENT_LAYOUT[2].map((key, index) => (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className="h-10 sm:h-12 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-base sm:text-lg font-bold text-gray-800 dark:text-white"
          >
            {isUpperCase ? key : key.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Third letter row - REDUCED HEIGHT */}
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        <button
          onClick={() => handleKeyPress('SHIFT')}
          className={`col-span-2 h-10 sm:h-12 rounded-lg ${
            isUpperCase
              ? 'bg-primary-500 hover:bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
          } active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-1 font-semibold text-xs sm:text-sm`}
        >
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Shift</span>
        </button>
        {CURRENT_LAYOUT[3].map((key, index) => (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className="h-10 sm:h-12 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-base sm:text-lg font-bold text-gray-800 dark:text-white"
          >
            {isUpperCase ? key : key.toLowerCase()}
          </button>
        ))}
        <button
          onClick={() => handleKeyPress('BACKSPACE')}
          className="col-span-2 h-10 sm:h-12 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-white font-semibold text-xs sm:text-sm"
          title="Delete"
        >
          <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Del</span>
        </button>
      </div>

      {/* Language-specific special characters row - REDUCED HEIGHT */}
      {CURRENT_LAYOUT[4] && CURRENT_LAYOUT[4].length > 0 && (
        <div className="flex items-center gap-1 sm:gap-1.5 justify-center">
          {/* Label for special characters */}
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Special:
          </div>
          {/* Special character buttons */}
          <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-center">
            {CURRENT_LAYOUT[4].map((key, index) => (
              <button
                key={index}
                onClick={() => handleKeyPress(key)}
                className="h-9 sm:h-10 px-2 sm:px-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-sm sm:text-base font-bold text-white"
                title={`Special character: ${key}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom row - optimized for kiosk - REDUCED HEIGHT */}
      <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
        {inputType === 'email' ? (
          <>
            {/* Email special keys */}
            {EMAIL_SPECIAL_KEYS.map((key, index) => (
              <button
                key={index}
                onClick={() => handleKeyPress(key)}
                className="h-10 sm:h-11 rounded-lg bg-purple-500 hover:bg-purple-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-xs sm:text-sm font-bold text-white"
              >
                {key}
              </button>
            ))}
            {/* Space bar for email mode */}
            <button
              onClick={() => handleKeyPress('SPACE')}
              className="col-span-3 h-10 sm:h-11 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-gray-800 dark:text-white font-semibold text-xs sm:text-sm"
            >
              <Space className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Space</span>
            </button>
          </>
        ) : (
          /* Large space bar for normal mode - spans 6 columns */
          <button
            onClick={() => handleKeyPress('SPACE')}
            className="col-span-4 h-10 sm:h-11 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-gray-800 dark:text-white font-semibold text-sm sm:text-base"
          >
            <Space className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Space</span>
          </button>
        )}
        
        {/* Hyphen/Dash - commonly used */}
        <button
          onClick={() => handleKeyPress('-')}
          className="h-10 sm:h-11 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg text-lg sm:text-xl font-bold text-gray-800 dark:text-white"
          title="Hyphen"
        >
          -
        </button>

        {/* Navigation arrows - grouped together */}
        <button
          onClick={() => handleKeyPress('ARROW_LEFT')}
          className="h-10 sm:h-11 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center text-white"
          title="Move Cursor Left"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => handleKeyPress('ARROW_RIGHT')}
          className="h-10 sm:h-11 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center text-white"
          title="Move Cursor Right"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {/* Clear button */}
        <button
          onClick={() => handleKeyPress('CLEAR')}
          className="h-10 sm:h-11 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center text-white"
          title="Clear All"
        >
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {/* Enter button - prominent with 2 columns */}
        <button
          onClick={() => handleKeyPress('ENTER')}
          className="col-span-2 h-10 sm:h-11 rounded-lg bg-green-500 hover:bg-green-600 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-white font-bold text-xs sm:text-sm"
          title="Enter"
        >
          <CornerDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Enter</span>
        </button>
        
        {/* Hide keyboard button */}
        <button
          onClick={onClose}
          className="h-10 sm:h-11 rounded-lg bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 active:scale-95 transition-all duration-100 shadow-md hover:shadow-lg flex items-center justify-center"
          title="Hide Keyboard"
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-[200] animate-slide-up">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm -z-10"
        onClick={onClose}
      />

      {/* Keyboard Container - REDUCED PADDING */}
      <div className="bg-gradient-to-t from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 border-t-4 border-primary-500 shadow-2xl">
        <div className="max-w-7xl mx-auto p-1.5 sm:p-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                {fieldLabel || 'Virtual Keyboard'}
              </span>
              {/* Keyboard Layout Indicator */}
              <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm">
                {language === 'fr' ? 'AZERTY' : language === 'de' ? 'QWERTZ' : 'QWERTY'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Close keyboard"
            >
              <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Input Preview / Focus Field - REDUCED HEIGHT */}
          <div className="mb-1.5 sm:mb-2">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg shadow-lg border-2 border-primary-500 p-1.5 sm:p-2 min-h-[50px] transition-all duration-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {/* Field Label Display */}
                  {fieldLabel && (
                    <span className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-700">
                      📝 {fieldLabel}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {currentValue.length} chars
                  </span>
                </div>
                {currentValue.length > 0 && (
                  <button
                    onClick={() => handleKeyPress('CLEAR')}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold hover:underline transition-colors duration-100"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-all min-h-[24px] flex items-center leading-tight">
                  {currentValue ? (
                    <span className="animate-in fade-in duration-100 inline-flex items-center">
                      {/* Text before cursor */}
                      <span>{currentValue.slice(0, cursorPosition)}</span>
                      {/* Blinking Cursor */}
                      <span className="inline-block w-0.5 h-4 sm:h-5 bg-primary-500 animate-blink" />
                      {/* Text after cursor */}
                      <span>{currentValue.slice(cursorPosition)}</span>
                    </span>
                  ) : (
                    <>
                      <span className="text-gray-400 dark:text-gray-600 italic font-normal text-xs sm:text-sm">
                        Start typing...
                      </span>
                      {/* Blinking Cursor at start */}
                      <span className="inline-block w-0.5 h-4 sm:h-5 bg-primary-500 ml-1 animate-blink" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Layout */}
          {inputType === 'number' || inputType === 'tel' ? renderNumericKeyboard() : renderFullKeyboard()}
        </div>
      </div>
    </div>,
    document.body
  );
}