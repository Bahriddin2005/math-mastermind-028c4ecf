import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { BellRing, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export const NotificationPromptDialog = () => {
  const [open, setOpen] = useState(false);
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !isSupported) return;
    
    // Don't show if already granted or denied (browser-level block)
    if (permission === 'granted' || permission === 'denied') return;

    // Show prompt after a short delay for better UX
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setOpen(false);
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  if (!user || !isSupported || permission === 'granted') return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader className="text-center items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <BellRing className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">
            Bildirishnomalarni yoqish tavsiya qilinadi
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Kundalik mashqlar, seriya eslatmalari va yangi musobaqalar haqida xabar oling. Bildirishnomalar yordamida hech narsani o'tkazib yubormaysiz!
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
          <Button
            onClick={handleEnable}
            className="w-full gap-2 h-12 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold shadow-glow"
          >
            <BellRing className="w-5 h-5" />
            Bildirishnomalarni yoqish
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-muted-foreground text-sm"
          >
            Keyinroq
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
