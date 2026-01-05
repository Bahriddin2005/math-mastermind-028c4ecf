import { Sparkles, Sun, Moon, Sunrise } from 'lucide-react';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface WelcomeHeroProps {
  username?: string;
}

export const WelcomeHero = ({ username }: WelcomeHeroProps) => {
  const getTimeInfo = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Xayrli tong', icon: Sunrise, emoji: '🌅' };
    if (hour < 18) return { greeting: 'Xayrli kun', icon: Sun, emoji: '☀️' };
    return { greeting: 'Xayrli kech', icon: Moon, emoji: '🌙' };
  };

  const timeInfo = getTimeInfo();
  const TimeIcon = timeInfo.icon;

  return (
    <div 
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2rem] bg-gradient-to-br from-primary via-primary/95 to-primary/90 dark:from-primary/90 dark:via-primary/80 dark:to-primary/70 p-5 sm:p-8 md:p-10 lg:p-14 xl:p-16 text-primary-foreground opacity-0 animate-slide-up shadow-xl dark:shadow-primary/20" 
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Animated background decorations - Enhanced for dark mode */}
      <div className="absolute top-0 right-0 w-24 sm:w-40 lg:w-56 xl:w-72 h-24 sm:h-40 lg:h-56 xl:h-72 bg-primary-foreground/10 dark:bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-12 sm:w-20 lg:w-28 h-12 sm:h-20 lg:h-28 bg-primary-foreground/5 dark:bg-primary-foreground/[0.03] rounded-full animate-bounce-soft" />
      <div className="absolute bottom-0 left-0 w-20 sm:w-32 lg:w-48 xl:w-56 h-20 sm:h-32 lg:h-48 xl:h-56 bg-primary-foreground/5 dark:bg-primary-foreground/[0.03] rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute -bottom-10 right-10 sm:right-20 lg:right-32 w-16 sm:w-24 lg:w-36 h-16 sm:h-24 lg:h-36 bg-accent/20 dark:bg-accent/30 rounded-full blur-2xl" />
      <div className="absolute top-1/3 left-1/4 w-32 sm:w-48 lg:w-64 xl:w-80 h-32 sm:h-48 lg:h-64 xl:h-80 bg-primary-foreground/[0.02] dark:bg-white/[0.02] rounded-full blur-3xl" />
      
      {/* Floating particles - Hidden on very small screens */}
      <div className="absolute top-6 right-10 sm:right-20 lg:right-32 opacity-60 hidden xs:block">
        <Sparkles className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
      <div className="absolute bottom-8 sm:bottom-10 lg:bottom-16 right-16 sm:right-32 lg:right-48 opacity-40 hidden sm:block">
        <Sparkles className="h-3 lg:h-4 w-3 lg:w-4 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute top-1/2 right-6 sm:right-10 lg:right-16 opacity-30 hidden xs:block">
        <Sparkles className="h-4 sm:h-5 lg:h-6 w-4 sm:w-5 lg:w-6 animate-pulse" style={{ animationDelay: '0.8s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Top Section - Greeting above logo */}
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 lg:space-y-8 xl:space-y-10">
          {/* Main heading - Responsive sizes */}
          <div className="space-y-1 sm:space-y-2 lg:space-y-3">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold leading-tight tracking-tight">
              {username ? (
                <span className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 lg:gap-x-4">
                  <span className="opacity-90">Salom,</span>
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent drop-shadow-lg">
                      {username}
                    </span>
                    <span className="absolute -bottom-1 sm:-bottom-2 lg:-bottom-3 left-0 w-full h-1 sm:h-2 lg:h-3 bg-gradient-to-r from-amber-400/60 via-yellow-300/80 to-amber-400/60 rounded-full blur-sm" />
                    <span className="absolute -bottom-0.5 sm:-bottom-1.5 lg:-bottom-2 left-0 w-full h-1 sm:h-1.5 lg:h-2 bg-gradient-to-r from-amber-300 to-yellow-200 rounded-full" />
                  </span>
                  <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl animate-wave inline-block">👋</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4">
                  Xush kelibsiz! 
                  <span className="text-2xl sm:text-4xl lg:text-5xl animate-bounce-soft">🎉</span>
                </span>
              )}
            </h1>
          </div>

          {/* IQROMAX Logo - Enhanced with glow for dark mode */}
          <div className="flex items-center justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/30 dark:bg-white/20 rounded-2xl sm:rounded-3xl lg:rounded-[2rem] blur-xl sm:blur-2xl lg:blur-3xl scale-110 sm:scale-125 lg:scale-150 group-hover:scale-150 lg:group-hover:scale-175 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-amber-400/20 dark:from-emerald-400/30 dark:to-amber-400/30 rounded-2xl sm:rounded-3xl lg:rounded-[2rem] blur-lg sm:blur-xl lg:blur-2xl scale-105 sm:scale-110 lg:scale-125" />
              <div className="relative bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2rem] p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 shadow-xl sm:shadow-2xl dark:shadow-black/30 backdrop-blur-sm border border-white/50 dark:border-white/20 group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={iqromaxLogo} 
                  alt="IQROMAX" 
                  className="h-10 xs:h-12 sm:h-16 md:h-20 lg:h-28 xl:h-36 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Time greeting badge - Enhanced with better dark mode contrast */}
          <div className="inline-flex items-center gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-5 lg:px-6 xl:px-8 py-2 sm:py-2.5 lg:py-3 xl:py-4 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-primary-foreground/15 dark:bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 dark:border-primary-foreground/10 shadow-lg dark:shadow-black/20">
            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-primary-foreground/20 dark:bg-primary-foreground/15">
              <TimeIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
            </div>
            <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold tracking-wide">{timeInfo.greeting}</span>
            <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl animate-bounce-soft">{timeInfo.emoji}</span>
          </div>
          
          {/* Description - Enhanced readability */}
          <div className="relative max-w-lg lg:max-w-xl xl:max-w-2xl px-2 sm:px-0">
            <div className="absolute inset-0 bg-primary-foreground/5 dark:bg-primary-foreground/[0.03] rounded-xl sm:rounded-2xl lg:rounded-3xl blur-xl" />
            <p className="relative text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium opacity-95 dark:opacity-90 leading-relaxed">
              Mental arifmetika bo'yicha treninglarni davom ettiring va o'z natijalaringizni kuzating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};