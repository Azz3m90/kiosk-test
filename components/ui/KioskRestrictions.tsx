'use client';

import { useEffect } from 'react';

export const KioskRestrictions = () => {
  // Disable all restrictions in development mode
  const enableRestrictions = process.env.NEXT_PUBLIC_ENABLE_KIOSK_RESTRICTIONS !== 'false';
  
  useEffect(() => {
    if (!enableRestrictions) {
      return; // Skip all restrictions if disabled
    }
    const preventDefaultKeys = (e: KeyboardEvent) => {
      // Prevent F11 (fullscreen)
      if (e.key === 'F11') {
        e.preventDefault();
      }
      
      // Prevent F12 (developer tools)
      if (e.key === 'F12') {
        e.preventDefault();
      }
      
      // Prevent common browser shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p': // Print
          case 'u': // View source
          case 's': // Save
          case 'o': // Open file
          case 'i': // Developer tools
          case '+': // Zoom in
          case '=': // Zoom in (alternate)
          case '-': // Zoom out
          case '_': // Zoom out (alternate)
          case '0': // Reset zoom
            e.preventDefault();
            break;
        }
      }
      
      // Prevent Alt + arrow keys (browser navigation)
      if (e.altKey && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Prevent Alt + F4
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
      }
    };

    // Prevent mouse wheel zoom (Ctrl + wheel)
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Prevent pinch-to-zoom on touch devices
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent double-tap zoom on touch devices
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent gesture events (Safari)
    const preventGestureZoom = (e: Event) => {
      e.preventDefault();
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const enforceFullscreen = async () => {
      try {
        // Check if fullscreen API is available
        if (!document.fullscreenEnabled) {
          console.warn('Fullscreen API is not available');
          return;
        }
        
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch((err) => {
            // Silently handle user rejection or policy restrictions
            if (err.name !== 'NotAllowedError') {
              console.warn('Fullscreen request failed:', err.message);
            }
          });
        }
      } catch (error) {
        // Silently handle any errors to prevent console errors
        console.warn('Fullscreen not available:', error);
      }
    };

    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    // Force zoom level to 100%
    const resetZoom = () => {
      document.body.style.zoom = '1';
    };

    // Add event listeners
    window.addEventListener('keydown', preventDefaultKeys);
    window.addEventListener('wheel', preventWheelZoom, { passive: false });
    window.addEventListener('touchmove', preventPinchZoom, { passive: false });
    window.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
    window.addEventListener('gesturestart', preventGestureZoom);
    window.addEventListener('gesturechange', preventGestureZoom);
    window.addEventListener('gestureend', preventGestureZoom);
    window.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('dragstart', preventDragDrop);
    window.addEventListener('drop', preventDragDrop);
    window.addEventListener('selectstart', preventSelection);
    window.addEventListener('resize', resetZoom);
    
    // Initial fullscreen and zoom reset
    // enforceFullscreen(); // Disabled - fullscreen not needed when restrictions are off
    resetZoom();
    
    // Re-enable fullscreen when window gains focus
    // window.addEventListener('focus', enforceFullscreen); // Disabled - fullscreen not needed

    // Cleanup
    return () => {
      window.removeEventListener('keydown', preventDefaultKeys);
      window.removeEventListener('wheel', preventWheelZoom);
      window.removeEventListener('touchmove', preventPinchZoom);
      window.removeEventListener('touchend', preventDoubleTapZoom);
      window.removeEventListener('gesturestart', preventGestureZoom);
      window.removeEventListener('gesturechange', preventGestureZoom);
      window.removeEventListener('gestureend', preventGestureZoom);
      window.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('dragstart', preventDragDrop);
      window.removeEventListener('drop', preventDragDrop);
      window.removeEventListener('selectstart', preventSelection);
      window.removeEventListener('focus', enforceFullscreen);
      window.removeEventListener('resize', resetZoom);
    };
  }, [enableRestrictions]);

  return null; // This component doesn't render anything
};