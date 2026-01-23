import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from './ui/button';
import { X, Download, Smartphone, Share, Plus } from 'lucide-react';

export const PWAInstallBanner = () => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  
  const { 
    isInstalled, 
    isStandalone,
    canPromptInstall,
    promptInstall,
    isIOS,
    isAndroid,
  } = usePWAInstall();

  useEffect(() => {
    // Check if banner was dismissed before
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDay = 24 * 60 * 60 * 1000; // Show again after 1 day instead of 1 week
    
    // Show banner if not dismissed recently and not installed
    if (!isInstalled && !isStandalone && Date.now() - dismissedTime > oneDay) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, isStandalone]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (canPromptInstall) {
      const result = await promptInstall();
      if (result.success) {
        setIsDismissed(true);
      }
    } else {
      // Navigate to install page for manual instructions
      navigate('/install');
    }
  };

  // Don't show if installed, dismissed, or not ready
  if (isInstalled || isStandalone || isDismissed || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-4 md:max-w-sm z-40 animate-slide-up">
      <div className="bg-gradient-to-r from-primary via-primary/95 to-emerald-600 text-primary-foreground rounded-2xl p-3 sm:p-4 shadow-2xl border border-primary-foreground/10">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-primary-foreground/10 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="font-bold text-sm mb-0.5">
              📲 Ilovani o'rnating!
            </h4>
            <p className="text-xs opacity-90 mb-2.5 sm:mb-3 leading-relaxed">
              {isIOS ? (
                <>
                  <Share className="inline w-3 h-3 mr-1" />
                  Share → <Plus className="inline w-3 h-3 mx-0.5" /> Add to Home Screen
                </>
              ) : isAndroid ? (
                "Telefoningizga o'rnating - tezroq va qulay"
              ) : (
                "Qurilmangizga o'rnating - offline ishlaydi"
              )}
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 text-xs gap-1.5 bg-white text-primary hover:bg-white/90 font-bold shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                {canPromptInstall ? "O'rnatish" : "Ko'rsatma"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                Keyinroq
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
