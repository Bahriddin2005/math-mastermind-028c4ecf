import { useState } from 'react';
import { Zap, Star, X, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EnergyLimitBannerProps {
  energy: number;
  maxEnergy: number;
  problemsSolved: number;
  onDismiss?: () => void;
}

export const EnergyLimitBanner = ({
  energy,
  maxEnergy,
  problemsSolved,
  onDismiss
}: EnergyLimitBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const isLow = energy <= 2;
  const isDepleted = energy <= 0;

  if (!isVisible || energy > 3) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-4 sm:p-5",
        "border-2",
        isDepleted 
          ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800"
          : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800"
      )}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Star className="w-full h-full text-amber-500" />
        </div>

        {/* Close button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center",
            isDepleted 
              ? "bg-gradient-to-br from-amber-400 to-orange-500" 
              : "bg-gradient-to-br from-green-400 to-emerald-500"
          )}>
            {isDepleted ? (
              <span className="text-2xl">🎉</span>
            ) : (
              <Zap className="w-7 h-7 text-white" fill="currentColor" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isDepleted ? (
              <>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Bugungi mashqlar tugadi! 🌟
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Bugun <span className="font-bold text-primary">{problemsSolved}</span> ta misol yechdingiz - Ajoyib ish! 
                  Ertaga yana davom etamiz! 🚀
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Energiya kam qoldi! ⚡
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Yana <span className="font-bold text-green-500">{energy}</span> ta mashq qoldi. 
                  Zo'r davom etyapsiz! 💪
                </p>
              </>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isDepleted 
                      ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                      : "bg-gradient-to-r from-green-400 to-emerald-500"
                  )}
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {energy}/{maxEnergy}
              </span>
            </div>

            {/* Action button - only show Pro option when depleted */}
            {isDepleted && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to="/pricing">
                  <Button 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                  >
                    <Crown className="w-4 h-4" />
                    Cheksiz mashq uchun Pro 👑
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Motivational tip */}
        <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
          <p className="text-xs text-muted-foreground text-center">
            💡 {isDepleted 
              ? "Har kuni mashq qilsang, ustaga aylanasan!" 
              : "Sen juda yaxshi davom etyapsan, davom et!"
            }
          </p>
        </div>
      </div>
    </div>
  );
};
