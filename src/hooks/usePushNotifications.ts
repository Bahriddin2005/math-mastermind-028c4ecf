import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
  });

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'default',
    }));

    // Check if already subscribed
    if (isSupported && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setState(prev => ({
            ...prev,
            isSubscribed: !!subscription,
          }));
        });
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Brauzeringiz bildirishnomalarni qo\'llab-quvvatlamaydi');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        toast.success('Bildirishnomalar yoqildi!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Bildirishnomalar rad etildi');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Bildirishnomalarni yoqishda xatolik');
      return false;
    }
  }, [state.isSupported]);

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [state.permission]);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
  };
};
