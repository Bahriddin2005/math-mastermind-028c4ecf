import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const PageLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after a short delay
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 500);

    // Remove loader after fade animation
    const removeTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-300",
        fadeOut && "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo animation */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-pulse">
            <span className="text-3xl font-bold text-primary-foreground">iQ</span>
          </div>
          {/* Spinning ring */}
          <div className="absolute -inset-2 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        
        {/* Loading dots */}
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
