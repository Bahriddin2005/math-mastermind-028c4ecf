import { Zap, Star, TrendingUp, Flame, AlertTriangle, Gift } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GamificationDisplayProps {
  level: number;
  currentXp: number;
  requiredXp: number;
  levelProgress: number;
  energy: number;
  maxEnergy: number;
  combo: number;
  comboMultiplier: number;
  difficultyLevel: number;
  xpUntilLevelUp: number;
  isStruggling?: boolean;
  isFlagged?: boolean;
  showBonusHint?: boolean;
  compact?: boolean;
}

export const GamificationDisplay = ({
  level,
  currentXp,
  requiredXp,
  levelProgress,
  energy,
  maxEnergy,
  combo,
  comboMultiplier,
  difficultyLevel,
  xpUntilLevelUp,
  isStruggling = false,
  isFlagged = false,
  showBonusHint = false,
  compact = false,
}: GamificationDisplayProps) => {
  const isCloseToLevelUp = xpUntilLevelUp <= 50;

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {/* Level Badge */}
        <Badge variant="secondary" className="bg-primary/20 text-primary">
          <Star className="w-3 h-3 mr-1" />
          Lv.{level}
        </Badge>

        {/* Combo */}
        {combo > 0 && (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
            <Flame className="w-3 h-3 mr-1" />
            {combo}x ({comboMultiplier.toFixed(2)}x)
          </Badge>
        )}

        {/* Energy */}
        <Badge variant="secondary" className="bg-green-500/20 text-green-500">
          <Zap className="w-3 h-3 mr-1" />
          {energy}/{maxEnergy}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
      {/* Level and XP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
              {level}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Level {level}</p>
              <p className="text-xs text-muted-foreground">
                {currentXp} / {requiredXp} XP
              </p>
            </div>
          </div>
          
          {isCloseToLevelUp && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse">
              <Star className="w-3 h-3 mr-1" />
              {xpUntilLevelUp} XP Level UP!
            </Badge>
          )}
        </div>
        
        <Progress value={levelProgress} className="h-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Energy */}
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Energiya</span>
          </div>
          <p className="text-lg font-bold text-green-500">
            {energy}/{maxEnergy}
          </p>
        </div>

        {/* Combo */}
        <div className={cn(
          "p-3 rounded-lg border",
          combo > 0 
            ? "bg-orange-500/10 border-orange-500/20" 
            : "bg-muted/50 border-border/50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Flame className={cn("w-4 h-4", combo > 0 ? "text-orange-500" : "text-muted-foreground")} />
            <span className="text-xs text-muted-foreground">Combo</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            combo > 0 ? "text-orange-500" : "text-muted-foreground"
          )}>
            {combo > 0 ? `${combo}x` : '-'}
          </p>
          {combo > 0 && (
            <p className="text-xs text-orange-400">×{comboMultiplier.toFixed(2)} ball</p>
          )}
        </div>

        {/* Difficulty */}
        <div className={cn(
          "p-3 rounded-lg border",
          isStruggling 
            ? "bg-yellow-500/10 border-yellow-500/20" 
            : "bg-blue-500/10 border-blue-500/20"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={cn(
              "w-4 h-4",
              isStruggling ? "text-yellow-500" : "text-blue-500"
            )} />
            <span className="text-xs text-muted-foreground">Qiyinlik</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            isStruggling ? "text-yellow-500" : "text-blue-500"
          )}>
            {difficultyLevel}/10
          </p>
          {isStruggling && (
            <p className="text-xs text-yellow-400">Moslashtirildi</p>
          )}
        </div>

        {/* Multiplier */}
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Koeffitsient</span>
          </div>
          <p className="text-lg font-bold text-purple-500">
            ×{comboMultiplier.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Warnings / Hints */}
      {isFlagged && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Shubhali faoliyat aniqlandi. XP vaqtincha to'xtatildi.</span>
        </div>
      )}

      {showBonusHint && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-500">
          <Gift className="w-4 h-4" />
          <span className="text-sm font-medium">Bonus tayyor — challenge o'yna!</span>
        </div>
      )}
    </div>
  );
};
