import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
}

/**
 * Checks notification support across browsers and devices
 */
const checkNotificationSupport = (): boolean => {
  // Check basic Notification API
  if ('Notification' in window) return true;
  
  // Some mobile browsers support notifications only through service worker
  if ('serviceWorker' in navigator && 'PushManager' in window) return true;
  
  return false;
};

/**
 * Gets current permission, handling edge cases
 */
const getCurrentPermission = (): NotificationPermission => {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'default';
};

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
  });

  useEffect(() => {
    const isSupported = checkNotificationSupport();
    const permission = isSupported ? getCurrentPermission() : 'default';
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission,
    }));

    // Check push subscription via service worker
    if (isSupported && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready
        .then(registration => {
          return registration.pushManager?.getSubscription();
        })
        .then((subscription) => {
          setState(prev => ({
            ...prev,
            isSubscribed: !!subscription,
          }));
        })
        .catch(() => {
          // Silent fail - SW might not be ready yet
        });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error("Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi", {
        description: "Boshqa brauzer yoki qurilmadan foydalaning",
      });
      return false;
    }

    // If already denied at browser level, show help
    if ('Notification' in window && Notification.permission === 'denied') {
      toast.error("Bildirishnomalar bloklangan", {
        description: "Brauzer sozlamalaridan bildirishnomalarni ruxsat bering: Sozlamalar → Sayt sozlamalari → Bildirishnomalar",
        duration: 8000,
      });
      return false;
    }

    try {
      let permission: NotificationPermission = 'default';

      // Try standard Notification API first
      if ('Notification' in window) {
        permission = await Notification.requestPermission();
      }

      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        // Register service worker for reliable mobile notifications
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.ready;
          } catch {
            // SW not critical for basic notifications
          }
        }
        
        // Send a test notification to confirm it works
        sendNotificationViaBestMethod(
          "IQROMAX bildirishnomalari yoqildi! ✅",
          {
            body: "Endi siz muhim yangiliklar va eslatmalarni olasiz",
            tag: 'permission-granted',
          }
        );
        
        toast.success('Bildirishnomalar muvaffaqiyatli yoqildi!');
        return true;
      } else if (permission === 'denied') {
        toast.error("Bildirishnomalar rad etildi", {
          description: "Qayta yoqish uchun brauzer sozlamalaridan ruxsat bering",
          duration: 6000,
        });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Notification permission error:', error);
      toast.error("Bildirishnomalarni yoqishda xatolik yuz berdi");
      return false;
    }
  }, [state.isSupported]);

  /**
   * Sends notification using the best available method:
   * 1. Service Worker (best for mobile/PWA)
   * 2. Direct Notification API (fallback)
   */
  const sendNotificationViaBestMethod = useCallback((title: string, options?: NotificationOptions) => {
    const notifOptions: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      requireInteraction: false,
      ...options,
    };

    // Method 1: Service Worker (works better on mobile/PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          return registration.showNotification(title, notifOptions);
        })
        .catch(() => {
          // Fallback to direct API
          directNotification(title, notifOptions);
        });
    } else {
      // Method 2: Direct Notification API
      directNotification(title, notifOptions);
    }
  }, []);

  const directNotification = (title: string, options?: NotificationOptions) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
      }
    } catch (error) {
      console.error('Direct notification failed:', error);
    }
  };

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    const currentPermission = getCurrentPermission();
    
    if (currentPermission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    sendNotificationViaBestMethod(title, options);
  }, [sendNotificationViaBestMethod]);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
  };
};
