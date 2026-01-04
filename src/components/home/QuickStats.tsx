import { Trophy, Target, Flame, Clock, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  todayProblems: number;
  todayScore: number;
  streak: number;
  energy: number;
  maxEnergy: number;
  lives?: number;
  maxLives?: number;
  coins?: number;
}

export const QuickStats = ({
  todayProblems,
  todayScore,
  streak,
  energy,
  maxEnergy,
  lives = 5,
  maxLives = 5,
  coins = 0
}: QuickStatsProps) => {
  const stats = [
    {
      icon: Target,
      value: todayProblems,
      label: "Bugun",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: Trophy,
      value: todayScore,
      label: "Ball",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      icon: Flame,
      value: streak,
      label: "Streak",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      suffix: "🔥"
    },
    {
      icon: Zap,
      value: `${energy}/${maxEnergy}`,
      label: "Energiya",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10"
    }
  ];

  return (
    <div className="space-y-3">
      {/* Top bar with lives and coins */}
      <div className="flex items-center justify-between px-1">
        {/* Lives */}
        <div className="flex items-center gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart 
              key={i}
              className={cn(
                "w-5 h-5 transition-all duration-300",
                i < lives 
                  ? "text-red-500 fill-red-500" 
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-xs text-white font-bold">$</span>
          </div>
          <span className="font-bold text-amber-600 dark:text-amber-400">{coins}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat, index) => (
          <div 
            key={stat.label}
            className={cn(
              "flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all duration-300",
              stat.bg,
              "hover:scale-105"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <stat.icon className={cn("w-5 h-5 mb-1", stat.color)} />
            <span className="text-sm sm:text-base font-bold text-foreground">
              {stat.value}
              {stat.suffix}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
