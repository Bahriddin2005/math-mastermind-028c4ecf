import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface GameCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  color: 'purple' | 'blue' | 'green' | 'yellow' | 'pink' | 'orange';
  onClick?: () => void;
  badge?: string;
  locked?: boolean;
  stars?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  purple: {
    bg: 'from-kids-purple via-purple-500 to-violet-600',
    glow: 'shadow-kids-purple/40 hover:shadow-kids-purple/60',
    icon: 'bg-white/20',
    badge: 'bg-yellow-400 text-yellow-900',
  },
  blue: {
    bg: 'from-kids-blue via-blue-500 to-cyan-500',
    glow: 'shadow-kids-blue/40 hover:shadow-kids-blue/60',
    icon: 'bg-white/20',
    badge: 'bg-yellow-400 text-yellow-900',
  },
  green: {
    bg: 'from-kids-green via-emerald-500 to-teal-500',
    glow: 'shadow-kids-green/40 hover:shadow-kids-green/60',
    icon: 'bg-white/20',
    badge: 'bg-yellow-400 text-yellow-900',
  },
  yellow: {
    bg: 'from-kids-yellow via-amber-400 to-orange-400',
    glow: 'shadow-kids-yellow/40 hover:shadow-kids-yellow/60',
    icon: 'bg-white/20',
    badge: 'bg-purple-500 text-white',
  },
  pink: {
    bg: 'from-kids-pink via-pink-500 to-rose-500',
    glow: 'shadow-kids-pink/40 hover:shadow-kids-pink/60',
    icon: 'bg-white/20',
    badge: 'bg-yellow-400 text-yellow-900',
  },
  orange: {
    bg: 'from-orange-400 via-orange-500 to-red-500',
    glow: 'shadow-orange-400/40 hover:shadow-orange-500/60',
    icon: 'bg-white/20',
    badge: 'bg-yellow-400 text-yellow-900',
  },
};

export const GameCard = ({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  badge,
  locked = false,
  stars = 0,
  className,
  size = 'md',
}: GameCardProps) => {
  const colors = colorClasses[color];
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const iconInnerSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6 sm:w-7 sm:h-7',
    lg: 'w-8 h-8 sm:w-10 sm:h-10',
  };

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={cn(
        'relative w-full rounded-3xl transition-all duration-300 group overflow-hidden',
        'bg-gradient-to-br',
        colors.bg,
        'shadow-xl',
        colors.glow,
        'hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]',
        'focus:outline-none focus:ring-4 focus:ring-white/50',
        locked && 'opacity-60 cursor-not-allowed grayscale',
        sizeClasses[size],
        className
      )}
    >
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-lg" />
      
      {/* Sparkle effects */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full animate-ping opacity-60" />
      <div className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center text-white">
        {/* Badge */}
        {badge && (
          <div className={cn(
            'absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-xs font-bold',
            colors.badge,
            'animate-bounce-soft shadow-lg'
          )}>
            {badge}
          </div>
        )}

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl backdrop-blur-sm z-20">
            <div className="text-4xl">🔒</div>
          </div>
        )}

        {/* Icon container */}
        <div className={cn(
          'rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3',
          colors.icon,
          iconSizes[size]
        )}>
          <Icon className={cn('text-white drop-shadow-lg', iconInnerSizes[size])} />
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-bold drop-shadow-md',
          size === 'sm' && 'text-base',
          size === 'md' && 'text-lg sm:text-xl',
          size === 'lg' && 'text-xl sm:text-2xl'
        )}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-white/80 text-sm mt-1 line-clamp-2">
            {description}
          </p>
        )}

        {/* Stars */}
        {stars > 0 && (
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'text-xl transition-all',
                  i <= stars ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
                )}
              >
                ⭐
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
    </button>
  );
};
