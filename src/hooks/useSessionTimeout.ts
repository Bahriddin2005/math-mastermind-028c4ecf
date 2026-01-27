import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number; // Timeout in minutes
  warningMinutes?: number; // Warning before timeout
  enabled?: boolean;
}

export const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  enabled = true
}: UseSessionTimeoutOptions = {}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(async () => {
    clearTimers();
    toast({
      title: "Sessiya tugadi",
      description: "Xavfsizlik maqsadida avtomatik chiqarildingiz",
      variant: "destructive"
    });
    await signOut();
  }, [signOut, toast, clearTimers]);

  const showWarning = useCallback(() => {
    toast({
      title: "Sessiya tugayapti",
      description: `${warningMinutes} daqiqadan so'ng avtomatik chiqarilasiz. Davom etish uchun sahifani yangilang.`,
    });
  }, [toast, warningMinutes]);

  const resetTimers = useCallback(() => {
    if (!enabled || !user) return;

    lastActivityRef.current = Date.now();
    clearTimers();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // Set warning timer
    if (warningMinutes > 0 && warningMs > 0) {
      warningRef.current = setTimeout(showWarning, warningMs);
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
  }, [enabled, user, timeoutMinutes, warningMinutes, clearTimers, showWarning, handleTimeout]);

  useEffect(() => {
    if (!enabled || !user) {
      clearTimers();
      return;
    }

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttled reset function
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledReset = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        resetTimers();
      }, 1000); // Throttle to once per second
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      clearTimers();
    };
  }, [enabled, user, resetTimers, clearTimers]);

  return {
    resetTimers,
    lastActivity: lastActivityRef.current
  };
};
