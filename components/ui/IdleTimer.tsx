'use client';

import { useEffect, useRef, useState } from 'react';
import { useKiosk } from '@/context/KioskContext';
import { AlertTriangle } from 'lucide-react';

interface IdleTimerProps {
  idleTimeout?: number; // Time in ms before showing warning (default: 60 seconds)
  warningTimeout?: number; // Time in ms to show warning before reset (default: 30 seconds)
}

export function IdleTimer({ 
  idleTimeout = 60000, // 60 seconds
  warningTimeout = 30000 // 30 seconds
}: IdleTimerProps) {
  const { resetKiosk, currentStep } = useKiosk();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningTimeout / 1000);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store the resetKiosk function in a ref to avoid dependency issues
  const resetKioskRef = useRef(resetKiosk);
  // Store showWarning in a ref so event handlers can access current value
  const showWarningRef = useRef(showWarning);
  
  useEffect(() => {
    resetKioskRef.current = resetKiosk;
  }, [resetKiosk]);
  
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Clear all timers function - stable reference
  const clearAllTimers = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleReset = () => {
    clearAllTimers();
    setShowWarning(false);
    resetKioskRef.current();
  };

  const startWarning = () => {
    setShowWarning(true);
    setCountdown(warningTimeout / 1000);

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set final reset timer
    warningTimerRef.current = setTimeout(() => {
      handleReset();
    }, warningTimeout);
  };

  const resetIdleTimer = () => {
    clearAllTimers();
    setShowWarning(false);

    // Don't start timer on welcome/language page
    if (currentStep === 'welcome') {
      return;
    }

    // Start idle timer
    idleTimerRef.current = setTimeout(() => {
      startWarning();
    }, idleTimeout);
  };

  const handleUserActivity = () => {
    // Only reset timer if warning is not showing (use ref to get current value)
    if (!showWarningRef.current) {
      resetIdleTimer();
    }
  };

  const handleContinue = () => {
    clearAllTimers();
    setShowWarning(false);
    resetIdleTimer();
  };

  useEffect(() => {
    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Start initial timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      clearAllTimers();
    };
    // Only re-run if timeouts or currentStep changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleTimeout, warningTimeout, currentStep]);

  // Lock body scroll when warning is shown
  useEffect(() => {
    if (showWarning) {
      // Save original overflow style
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Lock scroll and compensate for scrollbar
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Cleanup: restore scroll when warning closes
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in border-2 border-yellow-400 dark:border-yellow-600">
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Are you still there?
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            Your session will be reset in <span className="font-bold text-red-600 dark:text-red-400 text-xl">{countdown}</span> seconds due to inactivity.
          </p>

          {/* Countdown Progress */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-8 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-500 to-red-500 dark:from-yellow-400 dark:to-red-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / (warningTimeout / 1000)) * 100}%` }}
            />
          </div>

          {/* Actions - Kiosk Optimized */}
          <div className="flex gap-4 w-full">
            <button
              onClick={handleContinue}
              className="flex-1 btn btn-primary text-lg py-4 font-bold shadow-lg hover:shadow-xl active:scale-95"
            >
              I'm Still Here
            </button>
            <button
              onClick={handleReset}
              className="flex-1 btn btn-secondary text-lg py-4 font-semibold active:scale-95"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}