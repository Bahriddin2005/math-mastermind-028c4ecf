import { useState, useEffect } from 'react';
import { Zap, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergyReadyBannerProps {
  energy: number;
  maxEnergy: number;
  onStart: () => void;
  onDismiss: () => void;
}

export const EnergyReadyBanner = ({
  energy,
  maxEnergy,
  onStart,
  onDismiss
}: EnergyReadyBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const isFull = energy >= maxEnergy;

  useEffect(() => {
    if (isFull) {
      setIsVisible(true);
    }
  }, [isFull]);

  if (!isVisible || !isFull) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-500">
      <div className={cn(
        "relative flex items-center gap-3 px-5 py-3 rounded-2xl",
        "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400",
        "text-amber-900 shadow-2xl shadow-amber-400/40",
        "border-2 border-white/30"
      )}>
        {/* Animated sparkles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <Sparkles className="absolute top-1 left-2 w-4 h-4 text-white/50 animate-pulse" />
          <Sparkles className="absolute bottom-1 right-10 w-3 h-3 text-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Energy icon with pulse */}
        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
          <div className="relative p-2 bg-white rounded-full">
            <Zap className="w-6 h-6 text-amber-500" fill="currentColor" />
          </div>
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="font-bold text-sm sm:text-base">
            ⚡ Energiya to'ldi!
          </p>
          <p className="text-xs text-amber-800">
            Hozir mashq qilish vaqti keldi!
          </p>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="px-4 py-2 bg-white text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-50 transition-colors shadow-md"
        >
          Boshlash
        </button>

        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
