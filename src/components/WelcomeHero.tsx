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
        <div className="flex-1">
          {/* Time greeting badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/15 backdrop-blur-sm mb-4">
            <TimeIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{timeInfo.greeting}</span>
            <span className="text-base">{timeInfo.emoji}</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 leading-tight">
            {username ? (
              <>
                Salom, <span className="relative">
                  {username}
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-accent/60 rounded-full" />
                </span>! 👋
              </>
            ) : (
              'Xush kelibsiz! 🎉'
            )}
          </h1>
          
          {/* Description */}
          <p className="text-base md:text-lg opacity-90 max-w-lg leading-relaxed">
            Mental arifmetika bo'yicha treninglarni davom ettiring va o'z natijalaringizni kuzating.
          </p>
        </div>

        {/* IQROMAX Logo */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-foreground/20 rounded-2xl blur-xl scale-110" />
            <div className="relative bg-white/95 dark:bg-white rounded-2xl p-4 shadow-xl backdrop-blur-sm">
              <img 
                src={iqromaxLogo} 
                alt="IQROMAX" 
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};