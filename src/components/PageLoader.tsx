import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import loadingLogo from '@/assets/iqromax-loading-logo.png';

// Check for slow connection or low-end device
const isSlowDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as any).connection;
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') return true;
  }
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) return true;
  return false;
};

export const PageLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Skip loader for slow devices to improve perceived performance
  const skipLoader = useMemo(() => isSlowDevice(), []);

  useEffect(() => {
    // For slow devices, skip loader immediately
    if (skipLoader) {
      setIsLoading(false);
      return;
    }

    // Start fade out after a short delay
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 300); // Reduced from 500ms

    // Remove loader after fade animation
    const removeTimer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduced from 800ms

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [skipLoader]);

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-200",
        fadeOut && "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Simple logo without heavy animations */}
        <div className="relative">
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src={loadingLogo} 
              alt="IQROMAX" 
              className="w-full h-full object-cover rounded-full"
              loading="eager"
            />
          </div>
          {/* Simple spinner instead of complex animation */}
          <div className="absolute -inset-1.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" 
               style={{ animationDuration: '1s' }} />
        </div>
        
        {/* Simple loading text instead of animated dots */}
        <span className="text-sm text-muted-foreground">Yuklanmoqda...</span>
      </div>
    </div>
  );
};
