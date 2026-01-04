import { useState, useEffect } from 'react';
import { Sparkles, Zap, Star, Crown, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroCharacterProps {
  username: string;
  level: number;
  avatarUrl?: string | null;
  characterType?: 'ninja' | 'wizard' | 'robot' | 'superhero';
  isVip?: boolean;
  streak?: number;
  onAvatarClick?: () => void;
}

// Qahramon turlari va ularning xususiyatlari
const CHARACTER_THEMES = {
  ninja: {
    title: 'Matematik Ninja',
    color: 'from-slate-600 to-slate-800',
    accent: 'bg-red-500',
    emoji: '🥷',
    badge: '⚡'
  },
  wizard: {
    title: 'Sehrgar Hisobchi',
    color: 'from-purple-500 to-indigo-700',
    accent: 'bg-amber-400',
    emoji: '🧙‍♂️',
    badge: '✨'
  },
  robot: {
    title: 'Super Robot',
    color: 'from-cyan-500 to-blue-700',
    accent: 'bg-emerald-400',
    emoji: '🤖',
    badge: '🔋'
  },
  superhero: {
    title: 'Hisob Qahramoni',
    color: 'from-red-500 to-orange-600',
    accent: 'bg-yellow-400',
    emoji: '🦸',
    badge: '💥'
  }
};

const getLevelTitle = (level: number): { title: string; nextTitle: string; progress: number } => {
  const titles = [
    { min: 1, max: 5, title: "Yangi Sarguzasht", next: "Tez Hisobchi" },
    { min: 6, max: 10, title: "Tez Hisobchi", next: "Matematik" },
    { min: 11, max: 20, title: "Matematik", next: "Usta" },
    { min: 21, max: 35, title: "Usta", next: "Master" },
    { min: 36, max: 50, title: "Master", next: "Grandmaster" },
    { min: 51, max: 75, title: "Grandmaster", next: "Legenda" },
    { min: 76, max: 100, title: "Legenda", next: "Afsonaviy" },
  ];
  
  const current = titles.find(t => level >= t.min && level <= t.max) || titles[titles.length - 1];
  const progress = ((level - current.min) / (current.max - current.min + 1)) * 100;
  
  return { title: current.title, nextTitle: current.next, progress };
};

export const HeroCharacter = ({
  username,
  level,
  avatarUrl,
  characterType = 'wizard',
  isVip = false,
  streak = 0,
  onAvatarClick
}: HeroCharacterProps) => {
  const [showSparkle, setShowSparkle] = useState(false);
  const theme = CHARACTER_THEMES[characterType];
  const levelInfo = getLevelTitle(level);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-amber-400/50 animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Main avatar area */}
      <div 
        className="relative cursor-pointer group"
        onClick={onAvatarClick}
      >
        {/* Outer glow ring */}
        <div className={cn(
          "absolute -inset-3 rounded-full opacity-60 blur-md animate-pulse",
          `bg-gradient-to-r ${theme.color}`
        )} />

        {/* Character emoji or avatar */}
        <div className={cn(
          "relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center",
          "border-4 border-white/30 shadow-2xl overflow-hidden",
          `bg-gradient-to-br ${theme.color}`,
          "group-hover:scale-105 transition-transform duration-300"
        )}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl sm:text-6xl">{theme.emoji}</span>
          )}

          {/* Sparkle effect */}
          {showSparkle && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-amber-300 animate-ping" />
            </div>
          )}
        </div>

        {/* VIP crown */}
        {isVip && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce">
            <Crown className="w-8 h-8 text-amber-400 drop-shadow-lg" fill="currentColor" />
          </div>
        )}

        {/* Level badge */}
        <div className={cn(
          "absolute -bottom-2 left-1/2 -translate-x-1/2",
          "px-4 py-1 rounded-full",
          "bg-gradient-to-r from-amber-400 to-orange-500",
          "text-white font-bold text-sm shadow-lg",
          "flex items-center gap-1"
        )}>
          <Star className="w-4 h-4" fill="currentColor" />
          Lvl {level}
        </div>

        {/* Streak fire */}
        {streak >= 3 && (
          <div className="absolute -right-2 top-0 animate-bounce">
            <div className="relative">
              <Flame className="w-8 h-8 text-orange-500" fill="currentColor" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {streak}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Username and title */}
      <div className="mt-6 text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          {username}
          {isVip && <Sparkles className="w-5 h-5 text-amber-400" />}
        </h2>
        
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
          `bg-gradient-to-r ${theme.color}`,
          "text-white text-sm font-medium shadow-md"
        )}>
          <span>{theme.badge}</span>
          <span>{theme.title}: {levelInfo.title}</span>
        </div>

        {/* Progress to next title */}
        <div className="mt-3 w-48 mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{levelInfo.title}</span>
            <span>{levelInfo.nextTitle}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                `bg-gradient-to-r ${theme.color}`
              )}
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
