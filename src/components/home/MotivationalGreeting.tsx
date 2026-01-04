import { useState, useEffect } from 'react';
import { Flame, Sparkles, Trophy, Zap, Star, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MotivationalGreetingProps {
  username: string;
  streak: number;
  lastScore?: number;
  todayProblems?: number;
}

interface GreetingData {
  text: string;
  emoji: string;
  icon: typeof Flame;
  color: string;
}

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const getGreeting = (username: string, streak: number, todayProblems: number): GreetingData => {
  const time = getTimeOfDay();
  
  // Streak based greetings
  if (streak >= 7) {
    return {
      text: `${username}, sen chempionsan! 🏆`,
      emoji: '🔥',
      icon: Flame,
      color: 'from-amber-500 to-red-500'
    };
  }
  
  if (streak >= 3) {
    return {
      text: `Bugun sen formadasan, ${username}!`,
      emoji: '💪',
      icon: Zap,
      color: 'from-purple-500 to-pink-500'
    };
  }

  // Activity based greetings
  if (todayProblems > 10) {
    return {
      text: `Zo'r harakat, ${username}! Davom et!`,
      emoji: '⭐',
      icon: Star,
      color: 'from-amber-400 to-yellow-500'
    };
  }

  // Time based greetings with motivation
  const greetings = {
    morning: [
      { text: `Xayrli tong, ${username}! Rekord qo'yamizmi?`, emoji: '🌅', icon: Target, color: 'from-orange-400 to-amber-500' },
      { text: `Yangi kun - yangi g'alabalar, ${username}!`, emoji: '☀️', icon: Sparkles, color: 'from-yellow-400 to-orange-500' },
    ],
    afternoon: [
      { text: `Salom, ${username}! Bugun mashq qildingmi?`, emoji: '🎯', icon: Target, color: 'from-blue-400 to-cyan-500' },
      { text: `${username}, 3 daqiqa → sovrin! 🎁`, emoji: '⚡', icon: Zap, color: 'from-emerald-400 to-teal-500' },
    ],
    evening: [
      { text: `${username}, kechqurun mashq - aqlli tanlov!`, emoji: '🌙', icon: Star, color: 'from-purple-400 to-indigo-500' },
      { text: `Kunduzgi rekordni yengamizmi?`, emoji: '🏅', icon: Trophy, color: 'from-amber-400 to-orange-500' },
    ],
    night: [
      { text: `Tungi champion - ${username}!`, emoji: '🌟', icon: Sparkles, color: 'from-indigo-400 to-purple-500' },
      { text: `Oxirgi mashq uxlashdan oldin?`, emoji: '😴', icon: Star, color: 'from-slate-400 to-slate-600' },
    ],
  };

  const options = greetings[time];
  return options[Math.floor(Math.random() * options.length)];
};

export const MotivationalGreeting = ({ 
  username, 
  streak, 
  lastScore,
  todayProblems = 0
}: MotivationalGreetingProps) => {
  const [greeting, setGreeting] = useState<GreetingData | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setGreeting(getGreeting(username, streak, todayProblems));
    setShowAnimation(true);
  }, [username, streak, todayProblems]);

  if (!greeting) return null;

  const Icon = greeting.icon;

  return (
    <div className={cn(
      "relative overflow-hidden transition-all duration-500",
      showAnimation ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
    )}>
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-10 rounded-2xl",
        greeting.color
      )} />

      {/* Animated sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Sparkles 
          className={cn(
            "absolute top-2 right-4 w-4 h-4 animate-pulse",
            "text-amber-400"
          )} 
          style={{ animationDelay: '0s' }}
        />
        <Sparkles 
          className={cn(
            "absolute bottom-2 left-8 w-3 h-3 animate-pulse",
            "text-amber-400"
          )} 
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      <div className="relative flex items-center gap-3 p-4">
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br shadow-lg",
          greeting.color
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            {greeting.text}
          </h2>
          
          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{streak} kunlik streak!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
