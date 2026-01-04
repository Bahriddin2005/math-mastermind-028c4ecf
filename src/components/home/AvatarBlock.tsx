import { useState, useEffect } from 'react';
import { Star, Zap, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarBlockProps {
  username: string;
  level: number;
  avatarUrl?: string | null;
  levelTitle: string;
  isVip?: boolean;
}

// Level ga qarab unvon olish
const getLevelTitle = (level: number): string => {
  if (level <= 5) return "Yangi o'yinchi";
  if (level <= 10) return "Hisobchi";
  if (level <= 15) return "Tez Hisobchi";
  if (level <= 25) return "Matematik";
  if (level <= 40) return "Usta Hisobchi";
  if (level <= 60) return "Grandmaster";
  if (level <= 80) return "Ehtimol dahosi";
  return "Legendar";
};

const getLevelColor = (level: number): string => {
  if (level <= 5) return "from-gray-400 to-gray-500";
  if (level <= 10) return "from-green-400 to-green-600";
  if (level <= 15) return "from-blue-400 to-blue-600";
  if (level <= 25) return "from-purple-400 to-purple-600";
  if (level <= 40) return "from-amber-400 to-amber-600";
  if (level <= 60) return "from-rose-400 to-rose-600";
  if (level <= 80) return "from-cyan-400 to-cyan-600";
  return "from-yellow-400 via-amber-500 to-orange-600";
};

export const AvatarBlock = ({ username, level, avatarUrl, isVip }: AvatarBlockProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const levelTitle = getLevelTitle(level);
  const levelColor = getLevelColor(level);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [level]);

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {/* Avatar */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className={cn(
          "absolute -inset-1 rounded-full bg-gradient-to-r opacity-75 blur-sm animate-pulse",
          levelColor
        )} />
        
        {/* Avatar container */}
        <div className={cn(
          "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-transform duration-300",
          isAnimating && "scale-110",
          isVip ? "border-amber-400" : "border-primary/50"
        )}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={username} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn(
              "w-full h-full bg-gradient-to-br flex items-center justify-center",
              levelColor
            )}>
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* VIP crown */}
        {isVip && (
          <div className="absolute -top-2 -right-2 animate-bounce">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 drop-shadow-lg" />
          </div>
        )}

        {/* Level badge */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r flex items-center justify-center border-2 border-background shadow-lg",
          levelColor
        )}>
          <span className="text-xs sm:text-sm font-bold text-white">{level}</span>
        </div>
      </div>

      {/* User info */}
      <div className="flex flex-col">
        <span className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-1.5">
          {username}
          {isVip && <Sparkles className="w-4 h-4 text-amber-400" />}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r shadow-sm",
            levelColor
          )}>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {levelTitle}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
