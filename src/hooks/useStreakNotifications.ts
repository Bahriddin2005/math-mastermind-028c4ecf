import { useEffect, useCallback, useRef } from 'react';
import { usePushNotifications } from './usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface StreakData {
  currentStreak: number;
  lastActivityDate: string | null;
}

export const useStreakNotifications = () => {
  const { user } = useAuth();
  const { permission, sendLocalNotification, requestPermission } = usePushNotifications();
  const lastCheckedRef = useRef<string | null>(null);
  const notificationSentRef = useRef<boolean>(false);

  const checkStreakStatus = useCallback(async (): Promise<StreakData | null> => {
    if (!user) return null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, updated_at')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        return {
          currentStreak: (profile as any).current_streak || 0,
          lastActivityDate: (profile as any).updated_at,
        };
      }
    } catch (error) {
      console.error('Error checking streak:', error);
    }
    return null;
  }, [user]);

  const sendStreakReminder = useCallback(() => {
    if (permission !== 'granted') return;

    sendLocalNotification('🔥 Seriyangizni yo\'qotmang!', {
      body: 'Bugun hali mashq qilmadingiz. 5 daqiqalik mashq seriyangizni saqlab qoladi!',
      tag: 'streak-reminder',
      requireInteraction: true,
    });
  }, [permission, sendLocalNotification]);

  const sendStreakAchievement = useCallback((streak: number) => {
    if (permission !== 'granted') return;

    const milestones = [3, 5, 7, 14, 21, 30, 50, 100];
    if (milestones.includes(streak)) {
      sendLocalNotification(`🎉 ${streak} kunlik seriya!`, {
        body: `Tabriklaymiz! Siz ${streak} kun ketma-ket mashq qildingiz. Davom eting!`,
        tag: 'streak-achievement',
      });
    }
  }, [permission, sendLocalNotification]);

  const sendStreakLostNotification = useCallback(() => {
    if (permission !== 'granted') return;

    sendLocalNotification('😢 Seriya uzildi', {
      body: 'Kecha mashq qilmadingiz va seriya uzildi. Bugundan yangisini boshlang!',
      tag: 'streak-lost',
    });
  }, [permission, sendLocalNotification]);

  // Check streak status periodically
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const checkAndNotify = async () => {
      const today = new Date().toDateString();
      
      if (lastCheckedRef.current === today) return;
      lastCheckedRef.current = today;

      const streakData = await checkStreakStatus();
      if (!streakData) return;

      const { currentStreak, lastActivityDate } = streakData;

      if (lastActivityDate) {
        const lastActivity = new Date(lastActivityDate);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0 && now.getHours() >= 18 && !notificationSentRef.current) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const { count } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', todayStart.toISOString());

          if (count === 0 && currentStreak > 0) {
            sendStreakReminder();
            notificationSentRef.current = true;
          }
        }

        if (daysDiff > 1 && currentStreak === 0) {
          const lastLostNotification = localStorage.getItem('streak-lost-notification');
          if (lastLostNotification !== today) {
            sendStreakLostNotification();
            localStorage.setItem('streak-lost-notification', today);
          }
        }
      }
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, permission, checkStreakStatus, sendStreakReminder, sendStreakLostNotification]);

  return {
    checkStreakStatus,
    sendStreakReminder,
    sendStreakAchievement,
    sendStreakLostNotification,
    requestPermission,
  };
};
