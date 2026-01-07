import { Sparkles, Sun, Moon, Sunrise, Star, Zap, Trophy, Target } from 'lucide-react';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface WelcomeHeroProps {
  username?: string;
}

export const WelcomeHero = ({ username }: WelcomeHeroProps) => {
  const getTimeInfo = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Xayrli tong', icon: Sunrise, emoji: '🌅', color: 'from-orange-400 to-amber-500' };
    if (hour < 18) return { greeting: 'Xayrli kun', icon: Sun, emoji: '☀️', color: 'from-amber-400 to-yellow-500' };
    return { greeting: 'Xayrli kech', icon: Moon, emoji: '🌙', color: 'from-indigo-400 to-purple-500' };
  };

  const timeInfo = getTimeInfo();
  const TimeIcon = timeInfo.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
      {/* Main gradient background with mesh effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-kid-purple to-primary" />
      
      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.3),transparent)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(255,200,100,0.2),transparent)]" />
      </div>
      
      {/* Floating orbs with animation */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-br from-kid-yellow/20 to-transparent rounded-full blur-2xl animate-pulse" />
      
      {/* Geometric shapes */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-20 right-32 w-3 h-3 bg-accent/50 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-16 w-2 h-2 bg-kid-yellow/60 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      
      {/* Sparkle decorations */}
      <div className="absolute top-8 right-24 hidden sm:block">
        <Star className="h-5 w-5 text-white/40 animate-spin-slow" fill="currentColor" />
      </div>
      <div className="absolute bottom-16 left-32 hidden sm:block">
        <Star className="h-4 w-4 text-accent/50 animate-spin-slow" style={{ animationDelay: '-3s' }} fill="currentColor" />
      </div>
      <div className="absolute top-1/2 left-16 hidden md:block">
        <Sparkles className="h-6 w-6 text-white/30 animate-pulse" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10 md:p-12 lg:p-16">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          
          {/* Main heading with animated gradient text */}
          <div className="space-y-3">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black leading-tight tracking-tight text-white">
              {username ? (
                <span className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4">
                  <span className="opacity-90 drop-shadow-lg">Salom,</span>
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-white via-kid-yellow to-white bg-clip-text text-transparent drop-shadow-2xl animate-shimmer bg-[length:200%_100%]">
                      {username}
                    </span>
                    {/* Underline glow effect */}
                    <span className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-r from-transparent via-kid-yellow/60 to-transparent rounded-full blur-sm" />
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-kid-yellow/40 via-white/80 to-kid-yellow/40 rounded-full" />
                  </span>
                  <span className="text-3xl xs:text-4xl sm:text-5xl animate-wave inline-block drop-shadow-lg">👋</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3 sm:gap-4 drop-shadow-lg">
                  Xush kelibsiz!
                  <span className="text-3xl sm:text-5xl animate-bounce-soft">🎉</span>
                </span>
              )}
            </h1>
          </div>

          {/* IQROMAX Logo with premium glow effect */}
          <div className="flex items-center justify-center">
            <div className="relative group cursor-pointer">
              {/* Multi-layer glow effect */}
              <div className="absolute -inset-4 bg-white/40 rounded-3xl blur-2xl scale-110 group-hover:scale-125 transition-transform duration-700" />
              <div className="absolute -inset-2 bg-gradient-to-br from-kid-yellow/30 via-white/20 to-accent/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              
              {/* Logo container */}
              <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/50 group-hover:scale-105 transition-all duration-500">
                <img 
                  src={iqromaxLogo} 
                  alt="IQROMAX" 
                  className="h-12 xs:h-14 sm:h-20 md:h-24 lg:h-28 w-auto object-contain drop-shadow-lg"
                />
              </div>
              
              {/* Floating badges around logo */}
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-gradient-to-r from-kid-yellow to-accent rounded-full p-1.5 sm:p-2 shadow-lg animate-bounce-soft">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 bg-gradient-to-r from-kid-green to-teal-400 rounded-full p-1.5 sm:p-2 shadow-lg animate-bounce-soft" style={{ animationDelay: '-0.5s' }}>
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Time greeting badge - Premium glass design */}
          <div className={`inline-flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-3 sm:py-4 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-xl group hover:bg-white/20 transition-all duration-300 hover:scale-105`}>
            <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${timeInfo.color} shadow-lg`}>
              <TimeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-lg sm:text-xl font-bold text-white tracking-wide">{timeInfo.greeting}</span>
              <span className="text-xs sm:text-sm text-white/70 font-medium">Bugun ham mashq qilaylik!</span>
            </div>
            <span className="text-2xl sm:text-3xl animate-bounce-soft">{timeInfo.emoji}</span>
          </div>
          
          {/* Stats badges row */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Target className="h-4 w-4 text-kid-yellow" />
              <span className="text-sm font-semibold text-white/90">Maqsadga erishing</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-white/90">Tez hisoblang</span>
            </div>
          </div>
          
          {/* Description with glass effect */}
          <div className="relative max-w-2xl">
            <p className="text-base sm:text-xl md:text-2xl font-medium text-white/90 leading-relaxed drop-shadow-lg">
              Mental arifmetika bo'yicha treninglarni davom ettiring va o'z natijalaringizni kuzating.
            </p>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary/50 to-transparent" />
    </div>
  );
};