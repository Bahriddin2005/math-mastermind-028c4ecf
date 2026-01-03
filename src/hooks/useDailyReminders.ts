import { useState, useEffect, useCallback } from 'react';
import { usePushNotifications } from './usePushNotifications';
import { toast } from 'sonner';

interface ScheduledReminder {
  id: string;
  time: string; // HH:MM format
  enabled: boolean;
  label: string;
}

const STORAGE_KEY = 'daily-reminders';
const DEFAULT_REMINDERS: ScheduledReminder[] = [
  { id: '1', time: '09:00', enabled: false, label: 'Ertalabki mashq' },
  { id: '2', time: '18:00', enabled: false, label: 'Kechki mashq' },
];

export const useDailyReminders = () => {
  const [reminders, setReminders] = useState<ScheduledReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
    } catch {
      return DEFAULT_REMINDERS;
    }
  });
  
  const { isSupported, permission, requestPermission, sendLocalNotification } = usePushNotifications();
  const [nextReminderTime, setNextReminderTime] = useState<string | null>(null);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  // Calculate next reminder time
  useEffect(() => {
    const enabledReminders = reminders.filter(r => r.enabled);
    if (enabledReminders.length === 0) {
      setNextReminderTime(null);
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find next reminder
    const reminderMinutes = enabledReminders.map(r => {
      const [hours, mins] = r.time.split(':').map(Number);
      return { ...r, minutes: hours * 60 + mins };
    });

    // Sort by time
    reminderMinutes.sort((a, b) => a.minutes - b.minutes);

    // Find next one after current time
    let next = reminderMinutes.find(r => r.minutes > currentMinutes);
    
    // If none found today, use first one (tomorrow)
    if (!next) {
      next = reminderMinutes[0];
      setNextReminderTime(`Ertaga ${next.time}`);
    } else {
      setNextReminderTime(`Bugun ${next.time}`);
    }
  }, [reminders]);

  // Check for reminders every minute
  useEffect(() => {
    if (permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const matchingReminder = reminders.find(r => r.enabled && r.time === currentTime);
      
      if (matchingReminder) {
        // Check if we already sent this reminder today
        const lastSent = localStorage.getItem(`reminder-sent-${matchingReminder.id}`);
        const today = now.toDateString();
        
        if (lastSent !== today) {
          sendLocalNotification('IQROMAX - Mashq vaqti! 🧮', {
            body: `${matchingReminder.label} - Kundalik mashqingizni bajaring va ko'nikmalaringizni rivojlantiring!`,
            tag: `reminder-${matchingReminder.id}`,
            requireInteraction: true,
          });
          localStorage.setItem(`reminder-sent-${matchingReminder.id}`, today);
        }
      }
    };

    // Check immediately
    checkReminders();

    // Then check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [reminders, permission, sendLocalNotification]);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    // If enabling, check permission first
    if (!reminder.enabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Bildirishnomalar rad etildi');
        return;
      }
    }

    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));

    if (!reminder.enabled) {
      toast.success(`${reminder.label} yoqildi - ${reminder.time}`);
    }
  }, [reminders, permission, requestPermission]);

  const updateReminderTime = useCallback((id: string, time: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, time } : r
    ));
  }, []);

  const addReminder = useCallback(() => {
    const newId = Date.now().toString();
    setReminders(prev => [...prev, {
      id: newId,
      time: '12:00',
      enabled: false,
      label: `Mashq eslatmasi ${prev.length + 1}`,
    }]);
  }, []);

  const removeReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  return {
    reminders,
    isSupported,
    permission,
    nextReminderTime,
    toggleReminder,
    updateReminderTime,
    addReminder,
    removeReminder,
    requestPermission,
  };
};
