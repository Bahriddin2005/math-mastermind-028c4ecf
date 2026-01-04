import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, CheckCircle, XCircle, Smartphone } from "lucide-react";

export const NotificationSettings = () => {
  const { 
    isSupported, 
    permission, 
    requestPermission,
  } = usePushNotifications();

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Bildirishnomalar
        </CardTitle>
        <CardDescription>
          O'yin takliflari va muhim yangiliklar haqida xabar oling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser support check */}
        {!isSupported ? (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <BellOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Qo'llab-quvvatlanmaydi</p>
              <p className="text-sm text-muted-foreground">
                Brauzeringiz push bildirishnomalarni qo'llab-quvvatlamaydi
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Permission status */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                {permission === 'granted' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : permission === 'denied' ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <Bell className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {permission === 'granted' 
                      ? "Bildirishnomalar yoqilgan" 
                      : permission === 'denied'
                      ? "Bildirishnomalar rad etilgan"
                      : "Bildirishnomalar o'chirilgan"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {permission === 'granted' 
                      ? "Siz o'yin takliflari va yangiliklar haqida xabar olasiz"
                      : permission === 'denied'
                      ? "Brauzer sozlamalaridan qayta yoqing"
                      : "Bildirishnomalarni yoqish uchun tugmani bosing"
                    }
                  </p>
                </div>
              </div>
              {permission !== 'granted' && permission !== 'denied' && (
                <Button onClick={handleEnableNotifications}>
                  Yoqish
                </Button>
              )}
            </div>

            {/* Notification types */}
            {permission === 'granted' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Bildirishnoma turlari</h4>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="game-invites">O'yin takliflari</Label>
                  </div>
                  <Switch id="game-invites" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="friend-requests">Do'stlik so'rovlari</Label>
                  </div>
                  <Switch id="friend-requests" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="weekly-results">Haftalik natijalar</Label>
                  </div>
                  <Switch id="weekly-results" defaultChecked />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
