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
      className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-10 text-primary-foreground opacity-0 animate-slide-up" 
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Animated background decorations */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-primary-foreground/5 rounded-full animate-bounce-soft" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute -bottom-10 right-20 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
      
      {/* Floating particles */}
      <div className="absolute top-6 right-20 opacity-60">
        <Sparkles className="h-4 w-4 animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
      <div className="absolute bottom-10 right-32 opacity-40">
        <Sparkles className="h-3 w-3 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute top-1/2 right-10 opacity-30">
        <Sparkles className="h-5 w-5 animate-pulse" style={{ animationDelay: '0.8s' }} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1 space-y-5">
          {/* Time greeting badge - Enhanced */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-primary-foreground/20 backdrop-blur-md border border-primary-foreground/10 shadow-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary-foreground/20">
              <TimeIcon className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-wide">{timeInfo.greeting}</span>
            <span className="text-xl animate-bounce-soft">{timeInfo.emoji}</span>
          </div>
          
          {/* Main heading - Enhanced with gradient effect */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight">
              {username ? (
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="opacity-90">Salom,</span>
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent drop-shadow-lg">
                      {username}
                    </span>
                    <span className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-r from-amber-400/60 via-yellow-300/80 to-amber-400/60 rounded-full blur-sm" />
                    <span className="absolute -bottom-1.5 left-0 w-full h-1.5 bg-gradient-to-r from-amber-300 to-yellow-200 rounded-full" />
                  </span>
                  <span className="text-4xl md:text-5xl animate-wave inline-block">👋</span>
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  Xush kelibsiz! 
                  <span className="text-4xl animate-bounce-soft">🎉</span>
                </span>
              )}
            </h1>
          </div>
          
          {/* Description - Enhanced with glass effect */}
          <div className="relative max-w-lg">
            <div className="absolute inset-0 bg-primary-foreground/5 rounded-2xl blur-xl" />
            <p className="relative text-lg md:text-xl font-medium opacity-95 leading-relaxed pl-4 border-l-4 border-primary-foreground/30">
              Mental arifmetika bo'yicha treninglarni davom ettiring va o'z natijalaringizni kuzating.
            </p>
          </div>
        </div>

        {/* IQROMAX Logo */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/30 rounded-3xl blur-2xl scale-125 group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-amber-400/20 rounded-3xl blur-xl scale-110" />
            <div className="relative bg-white dark:bg-white rounded-3xl p-6 shadow-2xl backdrop-blur-sm border border-white/50 group-hover:scale-105 transition-transform duration-300">
              <img 
                src={iqromaxLogo} 
                alt="IQROMAX" 
                className="h-20 lg:h-24 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};