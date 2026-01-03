import { useDailyReminders } from '@/hooks/useDailyReminders';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  Clock,
  BellOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DailyRemindersSettings = () => {
  const {
    reminders,
    isSupported,
    permission,
    nextReminderTime,
    toggleReminder,
    updateReminderTime,
    addReminder,
    removeReminder,
    requestPermission,
  } = useDailyReminders();

  if (!isSupported) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="w-5 h-5" />
            <p className="text-sm">Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const enabledCount = reminders.filter(r => r.enabled).length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Kundalik eslatmalar</CardTitle>
              <p className="text-sm text-muted-foreground">
                {enabledCount > 0 
                  ? `${enabledCount} ta eslatma faol`
                  : 'Eslatmalar o\'chirilgan'
                }
              </p>
            </div>
          </div>
          {permission !== 'granted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              className="gap-2"
            >
              <BellRing className="w-4 h-4" />
              Yoqish
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Next reminder info */}
        {nextReminderTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
            <Clock className="w-4 h-4" />
            <span>Keyingi eslatma: <strong className="text-foreground">{nextReminderTime}</strong></span>
          </div>
        )}

        {/* Reminders list */}
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div 
              key={reminder.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                reminder.enabled 
                  ? "bg-primary/5 border-primary/20" 
                  : "bg-secondary/30 border-border/50"
              )}
            >
              <Switch
                checked={reminder.enabled}
                onCheckedChange={() => toggleReminder(reminder.id)}
              />
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  !reminder.enabled && "text-muted-foreground"
                )}>
                  {reminder.label}
                </p>
              </div>

              <Input
                type="time"
                value={reminder.time}
                onChange={(e) => updateReminderTime(reminder.id, e.target.value)}
                className="w-24 h-8 text-sm"
                disabled={!reminder.enabled && permission !== 'granted'}
              />

              {reminders.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeReminder(reminder.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add reminder button */}
        {reminders.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addReminder}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Yangi eslatma qo'shish
          </Button>
        )}

        {/* Permission notice */}
        {permission === 'denied' && (
          <p className="text-xs text-destructive text-center">
            Bildirishnomalar brauzer sozlamalarida bloklangan. 
            Sozlamalardan ruxsat bering.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
