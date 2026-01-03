import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.da340934fc03480cb04221f6c7553901',
  appName: 'IQROMAX',
  webDir: 'dist',
  server: {
    url: 'https://da340934-fc03-480c-b042-21f6c7553901.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A0A0F',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0F'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
