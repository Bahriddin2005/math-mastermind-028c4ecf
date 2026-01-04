import { Star, Gift, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPProgressPathProps {
  currentStep: number; // 0-5 steps
  totalSteps?: number;
  xpCurrent: number;
  xpRequired: number;
  onClaimReward?: () => void;
}

export const XPProgressPath = ({ 
  currentStep, 
  totalSteps = 5,
  xpCurrent,
  xpRequired,
  onClaimReward
}: XPProgressPathProps) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);
  const canClaim = currentStep >= totalSteps;

  return (
    <div className="relative px-2 py-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl blur-xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Kunlik yo'l
          </span>
          <span className="text-xs text-muted-foreground">
            {xpCurrent} / {xpRequired} XP
          </span>
        </div>

        {/* Progress path */}
        <div className="flex items-center justify-between relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted rounded-full -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/70 rounded-full -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />

          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div 
                key={step}
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-300",
                  isCompleted 
                    ? "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30" 
                    : isCurrent 
                      ? "bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary animate-pulse"
                      : "bg-muted border-2 border-border"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : isCurrent ? (
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
                ) : (
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50" />
                )}

                {/* Sparkle effect on current */}
                {isCurrent && (
                  <>
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 animate-bounce" />
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  </>
                )}
              </div>
            );
          })}

          {/* Reward at the end */}
          <div 
            onClick={canClaim ? onClaimReward : undefined}
            className={cn(
              "relative z-10 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-300",
              canClaim 
                ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-400/40 cursor-pointer hover:scale-110 animate-bounce"
                : "bg-muted border-2 border-dashed border-amber-400/30"
            )}
          >
            <Gift className={cn(
              "w-6 h-6 sm:w-7 sm:h-7",
              canClaim ? "text-white" : "text-amber-400/50"
            )} />
            
            {canClaim && (
              <>
                <Sparkles className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-300 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
              </>
            )}
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-4 text-center">
          {canClaim ? (
            <span className="text-sm font-medium text-amber-500 flex items-center justify-center gap-1">
              <Gift className="w-4 h-4" />
              Sovrinni olish uchun bosing!
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Yana {totalSteps - currentStep} mashq → sovrin! 🎁
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
