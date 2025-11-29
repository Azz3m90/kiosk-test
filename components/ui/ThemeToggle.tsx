'use client';

import { useKiosk } from '@/context/KioskContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { currentTheme, toggleTheme } = useKiosk();
  const isDark = currentTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-between bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full p-1 w-[70px] h-[36px] transition-all duration-300 shadow-inner hover:shadow-lg active:scale-95 touch-manipulation"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Sliding Toggle Circle */}
      <div
        className={`absolute top-1 left-1 w-7 h-7 rounded-full shadow-md transition-all duration-300 ease-in-out flex items-center justify-center ${
          isDark 
            ? 'translate-x-[34px] bg-gradient-to-br from-slate-300 to-slate-400' 
            : 'translate-x-0 bg-gradient-to-br from-yellow-300 to-yellow-500'
        }`}
      >
        {/* Active Icon with Glow */}
        {!isDark ? (
          <Sun className="w-4 h-4 text-yellow-700 drop-shadow-md" strokeWidth={3} />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 drop-shadow-md" strokeWidth={3} />
        )}
      </div>
    </button>
  );
}