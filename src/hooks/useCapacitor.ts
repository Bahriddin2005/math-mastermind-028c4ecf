import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';

export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    setPlatform(Capacitor.getPlatform() as 'ios' | 'android' | 'web');

    if (native) {
      // Hide splash screen
      SplashScreen.hide();

      // Configure status bar
      StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
      StatusBar.setBackgroundColor({ color: '#0A0A0F' }).catch(console.error);

      // Handle keyboard events
      Keyboard.addListener('keyboardWillShow', () => {
        setKeyboardVisible(true);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardVisible(false);
      });

      // Handle back button on Android
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    }

    return () => {
      if (native) {
        Keyboard.removeAllListeners();
        App.removeAllListeners();
      }
    };
  }, []);

  const hapticFeedback = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!isNative) return;
    
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    }[style];

    try {
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isNative]);

  return {
    isNative,
    platform,
    keyboardVisible,
    hapticFeedback
  };
};
