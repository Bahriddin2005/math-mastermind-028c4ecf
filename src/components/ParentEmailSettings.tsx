import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Mail, 
  Bell, 
  Calendar,
  Loader2,
  Check,
  Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EmailPreferences {
  id?: string;
  email: string;
  weekly_report_enabled: boolean;
  streak_alerts_enabled: boolean;
  last_report_sent_at?: string;
}

export const ParentEmailSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    email: '',
    weekly_report_enabled: true,
    streak_alerts_enabled: true,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('parent_email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
      }

      if (data) {
        setPreferences({
          id: data.id,
          email: data.email,
          weekly_report_enabled: data.weekly_report_enabled,
          streak_alerts_enabled: data.streak_alerts_enabled,
          last_report_sent_at: data.last_report_sent_at,
        });
      } else if (user.email) {
        setPreferences(prev => ({ ...prev, email: user.email || '' }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!preferences.email) {
      toast.error("Email manzilini kiriting");
      return;
    }

    setSaving(true);
    try {
      if (preferences.id) {
        // Update existing
        const { error } = await supabase
          .from('parent_email_preferences')
          .update({
            email: preferences.email,
            weekly_report_enabled: preferences.weekly_report_enabled,
            streak_alerts_enabled: preferences.streak_alerts_enabled,
          })
          .eq('id', preferences.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('parent_email_preferences')
          .insert({
            user_id: user.id,
            email: preferences.email,
            weekly_report_enabled: preferences.weekly_report_enabled,
            streak_alerts_enabled: preferences.streak_alerts_enabled,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPreferences(prev => ({ ...prev, id: data.id }));
        }
      }

      toast.success("Sozlamalar saqlandi!");
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!preferences.email) {
      toast.error("Email manzilini kiriting");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-report', {
        body: { testEmail: preferences.email },
      });

      if (error) throw error;
      toast.success("Test email yuborildi!");
    } catch (error: any) {
      console.error('Error sending test:', error);
      toast.error("Email yuborishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Email hisobotlari</CardTitle>
            <p className="text-sm text-muted-foreground">
              Haftalik natijalar va eslatmalar
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email manzil</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@mail.com"
            value={preferences.email}
            onChange={(e) => setPreferences(prev => ({ ...prev, email: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Hisobotlar shu manzilga yuboriladi
          </p>
        </div>

        {/* Weekly reports toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Haftalik hisobot</p>
              <p className="text-sm text-muted-foreground">
                Har hafta natijalar emailga yuboriladi
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.weekly_report_enabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, weekly_report_enabled: checked }))
            }
          />
        </div>

        {/* Streak alerts toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">Seriya eslatmalari</p>
              <p className="text-sm text-muted-foreground">
                Bola mashq qilmasa xabar keladi
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.streak_alerts_enabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, streak_alerts_enabled: checked }))
            }
          />
        </div>

        {/* Last sent info */}
        {preferences.last_report_sent_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
            <Check className="w-4 h-4 text-green-500" />
            <span>
              Oxirgi hisobot: {new Date(preferences.last_report_sent_at).toLocaleDateString('uz-UZ')}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Saqlash
          </Button>
          
          {preferences.id && (
            <Button 
              variant="outline" 
              onClick={sendTestEmail}
              disabled={saving}
            >
              <Send className="w-4 h-4 mr-2" />
              Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
