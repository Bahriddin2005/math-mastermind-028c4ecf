import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCapacitor } from '@/hooks/useCapacitor';
import { MobileBottomNav } from './MobileBottomNav';
import { cn } from '@/lib/utils';

interface MobileAppShellProps {
  children: ReactNode;
}

export const MobileAppShell = ({ children }: MobileAppShellProps) => {
  const { isNative, platform, keyboardVisible, hapticFeedback } = useCapacitor();
  const location = useLocation();
  
  // Hide bottom nav on auth pages
  const hideBottomNav = ['/auth', '/reset-password'].includes(location.pathname);

  // Haptic feedback on navigation
  useEffect(() => {
    if (isNative) {
      hapticFeedback('light');
    }
  }, [location.pathname, isNative, hapticFeedback]);

  return (
    <div 
      className={cn(
        "min-h-screen min-h-[100dvh] flex flex-col",
        isNative && "native-shell",
        platform === 'ios' && "ios-shell",
        platform === 'android' && "android-shell"
      )}
    >
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 w-full",
          !hideBottomNav && "pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))]",
          keyboardVisible && "pb-0"
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation - hidden when keyboard is visible */}
      {!hideBottomNav && !keyboardVisible && <MobileBottomNav />}
    </div>
  );
};
