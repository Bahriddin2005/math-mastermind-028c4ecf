import { useState } from 'react';
import { Play, Zap, Gamepad2, Sword, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BigStartButtonProps {
  onClick: () => void;
  variant?: 'start' | 'battle' | 'mission';
  label?: string;
  disabled?: boolean;
  energy?: number;
}

export const BigStartButton = ({ 
  onClick, 
  variant = 'start',
  label,
  disabled = false,
  energy = 10
}: BigStartButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'battle':
        return {
          gradient: 'from-purple-500 via-purple-600 to-indigo-700',
          glow: 'shadow-purple-500/50',
          icon: Sword,
          defaultLabel: "⚔️ Bugungi battle",
          bg: 'bg-purple-500/20'
        };
      case 'mission':
        return {
          gradient: 'from-blue-500 via-blue-600 to-cyan-700',
          glow: 'shadow-blue-500/50',
          icon: Target,
          defaultLabel: "🎯 Kundalik missiya",
          bg: 'bg-blue-500/20'
        };
      default:
        return {
          gradient: 'from-primary via-emerald-500 to-emerald-600',
          glow: 'shadow-primary/50',
          icon: Play,
          defaultLabel: "▶️ Boshlaymiz!",
          bg: 'bg-primary/20'
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Outer glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-3xl blur-xl opacity-50 transition-opacity duration-300",
        `bg-gradient-to-r ${styles.gradient}`,
        isPressed ? "opacity-70" : "opacity-50"
      )} />

      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={cn(
          "absolute w-full h-full rounded-3xl border-2 animate-ping opacity-30",
          variant === 'battle' ? 'border-purple-400' : variant === 'mission' ? 'border-blue-400' : 'border-primary'
        )} style={{ animationDuration: '2s' }} />
        <div className={cn(
          "absolute w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-3xl border animate-ping opacity-20",
          variant === 'battle' ? 'border-purple-400' : variant === 'mission' ? 'border-blue-400' : 'border-primary'
        )} style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      </div>

      {/* Main button */}
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={cn(
          "relative w-full py-6 sm:py-8 px-8 rounded-3xl font-bold text-2xl sm:text-3xl text-white transition-all duration-200",
          `bg-gradient-to-r ${styles.gradient}`,
          `shadow-2xl ${styles.glow}`,
          "border-2 border-white/20",
          "hover:scale-[1.02] active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isPressed && "scale-[0.98]"
        )}
      >
        {/* Inner shine */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
        
        {/* Content */}
        <div className="relative flex items-center justify-center gap-3">
          <div className={cn(
            "p-2 rounded-full bg-white/20 backdrop-blur-sm transition-transform",
            isPressed ? "scale-90" : "scale-100"
          )}>
            <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <span className="drop-shadow-lg">
            {label || styles.defaultLabel}
          </span>
        </div>

        {/* Energy indicator */}
        {energy !== undefined && energy > 0 && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-amber-400 text-amber-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            <Zap className="w-3 h-3" />
            {energy}
          </div>
        )}
      </button>

      {/* Bottom helper text */}
      <div className="mt-3 text-center text-sm text-muted-foreground">
        {disabled ? (
          <span className="text-destructive">Energiya tugadi! Dam oling.</span>
        ) : (
          <span>3 daqiqada tugatish = bonus 🎁</span>
        )}
      </div>
    </div>
  );
};
