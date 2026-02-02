import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check for low-end device (Android with limited memory)
const isLowEndDevice = () => {
  if (typeof navigator === 'undefined') return false;
  // Check for low memory device
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) return true;
  // Check for slow connection
  const connection = (navigator as any).connection;
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return true;
  }
  return false;
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);
  
  // Memoize device check to avoid re-computation
  const skipAnimation = useMemo(() => prefersReducedMotion() || isLowEndDevice(), []);

  useEffect(() => {
    // Skip animation for reduced motion or low-end devices
    if (skipAnimation) {
      setDisplayChildren(children);
      return;
    }

    // Start fade out
    setIsVisible(false);
    
    // After fade out, update children and fade in
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 100); // Reduced from 150ms for faster transitions

    return () => clearTimeout(timeout);
  }, [location.pathname, skipAnimation]);

  // Update children immediately on first render
  useEffect(() => {
    setDisplayChildren(children);
  }, [children]);

  // Skip transition styles for low-end devices
  if (skipAnimation) {
    return <div>{displayChildren}</div>;
  }

  return (
    <div
      className={`transition-opacity duration-150 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ willChange: 'opacity' }}
    >
      {displayChildren}
    </div>
  );
};
