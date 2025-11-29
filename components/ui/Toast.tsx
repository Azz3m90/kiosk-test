'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'eatin' | 'pickup' | 'delivery';
  onClose: () => void;
  duration?: number;
  position?: 'top-center' | 'bottom-right' | 'bottom-center';
}

export function Toast({ message, type = 'info', onClose, duration = 3000, position = 'top-center' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    error: <AlertCircle className="w-6 h-6 text-red-500" />,
    warning: <AlertCircle className="w-6 h-6 text-orange-500" />,
    info: <AlertCircle className="w-6 h-6 text-blue-500" />,
    eatin: <CheckCircle className="w-6 h-6 text-emerald-500" />,
    pickup: <CheckCircle className="w-6 h-6 text-orange-500" />,
    delivery: <CheckCircle className="w-6 h-6 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    warning: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    eatin: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    pickup: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    delivery: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  };

  // Position-based styles
  const positionStyles = {
    'top-center': {
      className: 'fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down',
      transform: 'translate(-50%, 0)',
    },
    'bottom-right': {
      className: 'fixed bottom-6 right-6 z-[9999] animate-slide-up',
      transform: 'translate(0, 0)',
    },
    'bottom-center': {
      className: 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up',
      transform: 'translate(-50%, 0)',
    },
  };

  const positionConfig = positionStyles[position];

  return (
    <div
      className={`
        flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2
        ${bgColors[type]}
        max-w-md w-auto
        ${positionConfig.className}
      `}
      style={{
        // Ensure toast stays fixed and isolated from page transforms
        position: 'fixed',
        isolation: 'isolate',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transform: positionConfig.transform,
      }}
      role="alert"
    >
      {icons[type]}
      <p className="text-base font-semibold text-gray-800 dark:text-white flex-1">
        {message}
      </p>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}