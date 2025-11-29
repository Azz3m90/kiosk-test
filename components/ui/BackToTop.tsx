'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-8 right-20 lg:right-24 z-30
        flex items-center justify-center
        w-20 h-20 lg:w-24 lg:h-24
        rounded-full shadow-2xl
        transition-all duration-300 ease-out
        touch-manipulation
        bg-gradient-to-br from-primary-500 to-secondary-500 dark:from-primary-600 dark:to-secondary-600
        hover:from-primary-600 hover:to-secondary-600 dark:hover:from-primary-700 dark:hover:to-secondary-700
        hover:scale-110 active:scale-95
        text-white
        ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-16 pointer-events-none'
        }
      `}
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp className="w-8 h-8 lg:w-10 lg:h-10 drop-shadow-md" strokeWidth={2.5} />
    </button>
  );
}