import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPullActive = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only allow pull to refresh when at the very top of the page
    if (window.scrollY > 5) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
    isPullActive.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    // If user scrolled down, cancel pull to refresh
    if (window.scrollY > 5) {
      setIsPulling(false);
      setPullDistance(0);
      isPullActive.current = false;
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // Only activate pull to refresh if pulling down significantly
    if (diff > 20) {
      isPullActive.current = true;
      // Resistance effect - pull distance increases slower as you pull more
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
    } else {
      // Allow normal scroll behavior
      isPullActive.current = false;
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing && isPullActive.current) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    isPullActive.current = false;
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    // Use passive: true for all touch events to not block scrolling
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  return {
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
  };
};
