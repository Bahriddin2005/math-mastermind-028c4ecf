import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
}

const checkNotificationSupport = (): boolean => {
  try {
    if ('Notification' in window) return true;
    if ('serviceWorker' in navigator && 'PushManager' in window) return true;
  } catch {
    // Some environments throw on property access
  }
  return false;
};

const getCurrentPermission = (): NotificationPermission => {
  try {
    if ('Notification' in window) {
      return Notification.permission;
    }
  } catch {
    // Ignore
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
    
    setState({
      isSupported,
      permission,
      isSubscribed: false,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!checkNotificationSupport()) {
      toast.error("Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi", {
        description: "Boshqa brauzer yoki qurilmadan foydalaning",
      });
      return false;
    }

    try {
      const currentPerm = getCurrentPermission();
      
      if (currentPerm === 'denied') {
        toast.error("Bildirishnomalar bloklangan", {
          description: "Brauzer sozlamalaridan bildirishnomalarni ruxsat bering: Sozlamalar → Sayt sozlamalari → Bildirishnomalar",
          duration: 8000,
        });
        return false;
      }

      if (currentPerm === 'granted') {
        setState(prev => ({ ...prev, permission: 'granted' }));
        toast.success('Bildirishnomalar allaqachon yoqilgan!');
        return true;
      }

      // Request permission
      let permission: NotificationPermission = 'default';
      
      if ('Notification' in window) {
        // Use callback style for maximum compatibility
        permission = await new Promise<NotificationPermission>((resolve) => {
          try {
            Notification.requestPermission((result) => {
              resolve(result);
            // Also handle promise-based API
            })?.then?.((result: NotificationPermission) => {
              resolve(result);
            });
          } catch {
            // If callback style fails, try promise style
            Notification.requestPermission().then(resolve).catch(() => resolve('default'));
          }
        });
      }

      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        // Send test notification
        try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification("IQROMAX bildirishnomalari yoqildi! ✅", {
              body: "Endi siz muhim yangiliklar va eslatmalarni olasiz",
              icon: '/pwa-192x192.png',
              tag: 'permission-granted',
            });
          } else {
            new Notification("IQROMAX bildirishnomalari yoqildi! ✅", {
              body: "Endi siz muhim yangiliklar va eslatmalarni olasiz",
              icon: '/pwa-192x192.png',
              tag: 'permission-granted',
            });
          }
        } catch {
          // Notification sent attempt failed, but permission is granted
        }
        
        toast.success('Bildirishnomalar muvaffaqiyatli yoqildi!');
        return true;
      } else if (permission === 'denied') {
        toast.error("Bildirishnomalar rad etildi", {
          description: "Qayta yoqish uchun brauzer sozlamalaridan ruxsat bering",
          duration: 6000,
        });
      }
      
      return false;
    } catch (error) {
      console.error('Notification permission error:', error);
      toast.error("Bildirishnomalarni yoqishda xatolik yuz berdi");
      return false;
    }
  }, []);

  const sendLocalNotification = useCallback((title: string, options?: { body?: string; tag?: string; requireInteraction?: boolean; icon?: string }) => {
    const currentPermission = getCurrentPermission();
    if (currentPermission !== 'granted') return;

    const notifOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    };

    try {
      // Try service worker first (better for mobile/PWA)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then(reg => reg.showNotification(title, notifOptions))
          .catch(() => {
            try { new Notification(title, notifOptions); } catch { /* ignore */ }
          });
      } else if ('Notification' in window) {
        new Notification(title, notifOptions);
      }
    } catch {
      // Silent fail
    }
  }, []);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
  };
};
