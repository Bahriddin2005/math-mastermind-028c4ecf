import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

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
  emoji?: string;
}

const colorClasses = {
  purple: {
    bg: 'from-kids-purple via-purple-500 to-violet-600',
    glow: 'shadow-kids-purple/50 hover:shadow-kids-purple/80',
    icon: 'bg-white/25 backdrop-blur-sm',
    badge: 'bg-yellow-400 text-yellow-900',
    ring: 'ring-white/40',
    particles: ['✨', '💜', '⭐'],
  },
  blue: {
    bg: 'from-kids-blue via-blue-500 to-cyan-500',
    glow: 'shadow-kids-blue/50 hover:shadow-kids-blue/80',
    icon: 'bg-white/25 backdrop-blur-sm',
    badge: 'bg-yellow-400 text-yellow-900',
    ring: 'ring-white/40',
    particles: ['💎', '🌊', '⚡'],
  },
  green: {
    bg: 'from-kids-green via-emerald-500 to-teal-500',
    glow: 'shadow-kids-green/50 hover:shadow-kids-green/80',
    icon: 'bg-white/25 backdrop-blur-sm',
    badge: 'bg-yellow-400 text-yellow-900',
    ring: 'ring-white/40',
    particles: ['🌟', '🍀', '✅'],
  },
  yellow: {
    bg: 'from-kids-yellow via-amber-400 to-orange-400',
    glow: 'shadow-kids-yellow/50 hover:shadow-kids-yellow/80',
    icon: 'bg-white/25 backdrop-blur-sm',
    badge: 'bg-purple-500 text-white',
    ring: 'ring-white/40',
    particles: ['⭐', '🌟', '✨'],
  },
  pink: {
    bg: 'from-kids-pink via-pink-500 to-rose-500',
    glow: 'shadow-kids-pink/50 hover:shadow-kids-pink/80',
    icon: 'bg-white/25 backdrop-blur-sm',
    badge: 'bg-yellow-400 text-yellow-900',
    ring: 'ring-white/40',
    particles: ['💖', '🌸', '✨'],
  },
  orange: {
    bg: 'from-orange-400 via-orange-500 to-red-500',
    glow: 'shadow-orange-400/50 hover:shadow-orange-500/80',
    icon: 'bg-white/25 backdrop-blur-sm',
    badge: 'bg-yellow-400 text-yellow-900',
    ring: 'ring-white/40',
    particles: ['🔥', '🏆', '⚡'],
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
  emoji,
}: GameCardProps) => {
  const colors = colorClasses[color];
  const [isPressed, setIsPressed] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const iconInnerSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  };

  const handleClick = () => {
    if (locked) return;
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 600);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      disabled={locked}
      className={cn(
        'relative w-full rounded-3xl transition-all duration-300 group overflow-hidden',
        'bg-gradient-to-br',
        colors.bg,
        'shadow-2xl',
        colors.glow,
        'hover:scale-[1.05] hover:-translate-y-2 active:scale-[0.95]',
        'focus:outline-none focus:ring-4',
        colors.ring,
        locked && 'opacity-60 cursor-not-allowed grayscale',
        isPressed && 'scale-95',
        sizeClasses[size],
        className
      )}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
      
      {/* Decorative circles with animation */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      
      {/* Floating sparkles */}
      <div className="absolute top-3 right-3 text-lg animate-bounce opacity-80" style={{ animationDuration: '1.5s' }}>✨</div>
      <div className="absolute bottom-4 right-6 text-sm animate-bounce opacity-60" style={{ animationDelay: '0.3s', animationDuration: '2s' }}>⭐</div>
      <div className="absolute top-1/2 left-3 text-xs animate-bounce opacity-50" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }}>✨</div>
      
      {/* Click particles effect */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {colors.particles.map((particle, i) => (
            <span
              key={i}
              className="absolute text-2xl animate-ping"
              style={{
                left: `${30 + i * 20}%`,
                top: `${20 + i * 15}%`,
                animationDuration: '0.5s',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {particle}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center text-white">
        {/* Badge */}
        {badge && (
          <div className={cn(
            'absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-xs font-black',
            colors.badge,
            'animate-bounce shadow-lg border-2 border-white/50'
          )}
          style={{ animationDuration: '2s' }}
          >
            {badge}
          </div>
        )}

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-sm z-20">
            <div className="text-5xl animate-bounce">🔒</div>
          </div>
        )}

        {/* Icon container with enhanced styling */}
        <div className={cn(
          'rounded-3xl flex items-center justify-center mb-4 transition-all duration-300',
          'group-hover:scale-125 group-hover:rotate-6 group-active:scale-95',
          'border-4 border-white/30 shadow-inner',
          colors.icon,
          iconSizes[size]
        )}>
          {emoji ? (
            <span className={cn(
              'drop-shadow-lg',
              size === 'sm' && 'text-3xl',
              size === 'md' && 'text-4xl',
              size === 'lg' && 'text-5xl'
            )}>
              {emoji}
            </span>
          ) : (
            <Icon className={cn('text-white drop-shadow-lg', iconInnerSizes[size])} />
          )}
        </div>

        {/* Title with enhanced styling */}
        <h3 className={cn(
          'font-black drop-shadow-lg tracking-wide',
          size === 'sm' && 'text-base',
          size === 'md' && 'text-xl sm:text-2xl',
          size === 'lg' && 'text-2xl sm:text-3xl'
        )}>
          {title}
        </h3>

        {/* Description with better visibility */}
        {description && (
          <p className="text-white/90 text-sm mt-2 line-clamp-2 font-medium drop-shadow">
            {description}
          </p>
        )}

        {/* Stars with animation */}
        {stars > 0 && (
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'text-2xl transition-all duration-300',
                  i <= stars 
                    ? 'opacity-100 scale-110 animate-bounce' 
                    : 'opacity-30 scale-75 grayscale'
                )}
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '2s' }}
              >
                ⭐
              </span>
            ))}
          </div>
        )}

        {/* Play indicator */}
        <div className={cn(
          'mt-4 flex items-center gap-2 bg-white/20 rounded-full px-4 py-2',
          'group-hover:bg-white/30 transition-all duration-300',
          'border border-white/30',
          size === 'sm' && 'hidden'
        )}>
          <span className="text-sm font-bold">O'ynash</span>
          <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>

      {/* Hover shine effect - enhanced */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
      
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
    </button>
  );
};
