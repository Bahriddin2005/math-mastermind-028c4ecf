import { useEffect, useState } from 'react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export const SessionTimeoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    timeoutMinutes: 30,
  });

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const enabled = localStorage.getItem('sessionTimeoutEnabled');
      const timeout = localStorage.getItem('sessionTimeoutMinutes');
      
      setSettings({
        enabled: enabled !== null ? enabled === 'true' : true,
        timeoutMinutes: timeout ? parseInt(timeout, 10) : 30,
      });
    };

    loadSettings();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sessionTimeoutEnabled' || e.key === 'sessionTimeoutMinutes') {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const handleCustomEvent = () => loadSettings();
    window.addEventListener('sessionTimeoutSettingsChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionTimeoutSettingsChanged', handleCustomEvent);
    };
  }, []);

  // useSessionTimeout internally checks for user via useAuth
  useSessionTimeout({
    timeoutMinutes: settings.timeoutMinutes,
    warningMinutes: 5,
    enabled: settings.enabled,
  });

  return <>{children}</>;
};
