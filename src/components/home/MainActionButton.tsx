import { useState, useEffect } from 'react';
import { Play, Sword, Target, Zap, Sparkles, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  energy?: number;
  maxEnergy?: number;
}

export const MainActionButton = ({
  onClick,
  disabled = false,
  energy = 10,
  maxEnergy = 10
}: MainActionButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Rocket animation on click
  const handleClick = () => {
    if (disabled) return;
    setShowRocket(true);
    setTimeout(() => {
      setShowRocket(false);
      onClick();
    }, 600);
  };

  // Pulse attention grabber
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto py-6">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          "w-80 h-80 rounded-full blur-3xl transition-all duration-1000",
          disabled ? "bg-muted/30" : "bg-gradient-to-r from-primary/30 via-emerald-400/30 to-teal-400/30",
          !disabled && pulseCount % 2 === 0 && "scale-110"
        )} />
      </div>

      {/* Animated rings */}
      {!disabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-64 h-64 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-72 h-72 rounded-full border-2 border-primary/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
      )}

      {/* Flying rocket animation */}
      {showRocket && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="animate-fly-up">
            <Rocket className="w-16 h-16 text-primary rotate-[-45deg]" />
          </div>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        disabled={disabled}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={cn(
          "relative w-full py-8 sm:py-10 px-6 rounded-[2rem] font-bold text-3xl sm:text-4xl text-white transition-all duration-300",
          disabled 
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : "bg-gradient-to-r from-primary via-emerald-500 to-teal-500 shadow-2xl shadow-primary/40",
          !disabled && "hover:scale-[1.03] active:scale-[0.97] hover:shadow-3xl hover:shadow-primary/50",
          isPressed && !disabled && "scale-[0.97]",
          "border-4 border-white/20"
        )}
      >
        {/* Shine overlay */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none" />
        
        {/* Sparkles decoration */}
        {!disabled && (
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
            <Sparkles className="absolute top-4 left-6 w-6 h-6 text-white/40 animate-pulse" />
            <Sparkles className="absolute bottom-4 right-8 w-5 h-5 text-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Sparkles className="absolute top-6 right-12 w-4 h-4 text-white/20 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}

        {/* Content */}
        <div className="relative flex flex-col items-center gap-2">
          <div className={cn(
            "flex items-center justify-center gap-4",
            isPressed && "scale-95"
          )}>
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" />
            </div>
            <span className="drop-shadow-2xl tracking-wide">
              Boshlaymiz!
            </span>
          </div>
          
          {/* Sub text */}
          <span className="text-sm sm:text-base font-normal text-white/80 mt-1">
            🚀 Miya sportiga tayyormisan?
          </span>
        </div>

        {/* Energy badge */}
        {!disabled && energy !== undefined && (
          <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
            <Zap className="w-4 h-4" fill="currentColor" />
            <span>{energy}/{maxEnergy}</span>
          </div>
        )}
      </button>

      {/* Helper text */}
      <div className="mt-4 text-center">
        {disabled ? (
          <div className="flex items-center justify-center gap-2 text-destructive font-medium">
            <Zap className="w-5 h-5" />
            <span>Energiya tugadi! Biroz dam ol yoki do'stlar bilan o'yna.</span>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            <span>⏱️ 3 daqiqada tugat</span>
            <span className="text-amber-500 font-medium">= Bonus sovrin! 🎁</span>
          </div>
        )}
      </div>
    </div>
  );
};
