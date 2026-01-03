import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'default';
  token: string | null;
}

export const useNativePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    token: null
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    // Check existing permission
    PushNotifications.checkPermissions().then(result => {
      setState(prev => ({
        ...prev,
        permission: result.receive === 'granted' ? 'granted' : 
                   result.receive === 'denied' ? 'denied' : 'default'
      }));
    });

    // Listen for registration success
    PushNotifications.addListener('registration', token => {
      console.log('Push registration success:', token.value);
      setState(prev => ({ ...prev, token: token.value }));
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', error => {
      console.error('Push registration error:', error);
    });

    // Listen for push notifications received
    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push notification received:', notification);
      toast.info(notification.title || 'Yangi xabar', {
        description: notification.body
      });
    });

    // Listen for push notification action
    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      console.log('Push notification action:', action);
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Push notifications bu qurilmada qo\'llab-quvvatlanmaydi');
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        await PushNotifications.register();
        setState(prev => ({ ...prev, permission: 'granted' }));
        toast.success('Bildirishnomalar yoqildi!');
        return true;
      } else {
        setState(prev => ({ ...prev, permission: 'denied' }));
        toast.error('Bildirishnomalar rad etildi');
        return false;
      }
    } catch (error) {
      console.error('Push notification permission error:', error);
      toast.error('Bildirishnomalarni yoqishda xatolik');
      return false;
    }
  }, [state.isSupported]);

  return {
    ...state,
    requestPermission
  };
};
