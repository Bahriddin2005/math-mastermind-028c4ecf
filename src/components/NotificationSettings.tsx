import { DailyRemindersSettings } from './DailyRemindersSettings';
import { ParentEmailSettings } from './ParentEmailSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useStreakNotifications } from '@/hooks/useStreakNotifications';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { 
  Bell, 
  BellRing, 
  Flame,
  Smartphone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const NotificationSettings = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { sendStreakReminder } = useStreakNotifications();
  const [streakNotificationsEnabled, setStreakNotificationsEnabled] = useState(() => {
    return localStorage.getItem('streak-notifications-enabled') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('streak-notifications-enabled', String(streakNotificationsEnabled));
  }, [streakNotificationsEnabled]);

  const handleEnableStreakNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error("Bildirishnomalar uchun ruxsat berilmadi");
        return;
      }
    }
    setStreakNotificationsEnabled(true);
    toast.success("Seriya eslatmalari yoqildi!");
  };

  const handleTestStreakNotification = () => {
    sendStreakReminder();
    toast.success("Test bildirishnomasi yuborildi!");
  };

  return (
    <div className="space-y-6">
      {/* Push notification status */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Qurilma bildirishnomalari</CardTitle>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted' 
                  ? '✅ Yoqilgan'
                  : permission === 'denied'
                    ? '❌ Bloklangan'
                    : '⏳ Ruxsat kutilmoqda'
                }
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isSupported ? (
            <p className="text-sm text-muted-foreground">
              Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi
            </p>
          ) : permission !== 'granted' ? (
            <Button onClick={requestPermission} className="w-full gap-2">
              <BellRing className="w-4 h-4" />
              Bildirishnomalarni yoqish
            </Button>
          ) : (
            <>
              {/* Streak notifications toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium">Seriya eslatmalari</p>
                    <p className="text-sm text-muted-foreground">
                      Seriya uzilish xavfi bo'lganda eslatma
                    </p>
                  </div>
                </div>
                <Switch
                  checked={streakNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnableStreakNotifications();
                    } else {
                      setStreakNotificationsEnabled(false);
                    }
                  }}
                />
              </div>

              {/* Test button */}
              {streakNotificationsEnabled && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestStreakNotification}
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test bildirishnomasi
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Daily reminders */}
      <DailyRemindersSettings />

      {/* Email reports */}
      <ParentEmailSettings />
    </div>
  );
};
