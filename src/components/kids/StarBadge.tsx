import { cn } from '@/lib/utils';
import { Star, Trophy, Medal, Award, Crown, Flame, Zap, Heart } from 'lucide-react';

type BadgeType = 'star' | 'trophy' | 'medal' | 'award' | 'crown' | 'flame' | 'zap' | 'heart';
type BadgeColor = 'gold' | 'silver' | 'bronze' | 'purple' | 'blue' | 'green' | 'pink';

interface StarBadgeProps {
  type?: BadgeType;
  color?: BadgeColor;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  animated?: boolean;
  className?: string;
}

const iconMap = {
  star: Star,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  heart: Heart,
};

const colorClasses = {
  gold: {
    bg: 'from-yellow-300 via-yellow-400 to-amber-500',
    shadow: 'shadow-yellow-400/50',
    icon: 'text-yellow-900',
  },
  silver: {
    bg: 'from-gray-200 via-gray-300 to-gray-400',
    shadow: 'shadow-gray-400/50',
    icon: 'text-gray-700',
  },
  bronze: {
    bg: 'from-amber-400 via-amber-500 to-amber-700',
    shadow: 'shadow-amber-500/50',
    icon: 'text-amber-900',
  },
  purple: {
    bg: 'from-purple-400 via-purple-500 to-violet-600',
    shadow: 'shadow-purple-500/50',
    icon: 'text-white',
  },
  blue: {
    bg: 'from-blue-400 via-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/50',
    icon: 'text-white',
  },
  green: {
    bg: 'from-green-400 via-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/50',
    icon: 'text-white',
  },
  pink: {
    bg: 'from-pink-400 via-pink-500 to-rose-500',
    shadow: 'shadow-pink-500/50',
    icon: 'text-white',
  },
};

const sizeClasses = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    count: 'text-[10px] -right-1 -top-1 w-4 h-4',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    count: 'text-xs -right-1 -top-1 w-5 h-5',
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    count: 'text-sm -right-2 -top-2 w-6 h-6',
  },
};

export const StarBadge = ({
  type = 'star',
  color = 'gold',
  size = 'md',
  count,
  animated = true,
  className,
}: StarBadgeProps) => {
  const Icon = iconMap[type];
  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg',
          colors.bg,
          colors.shadow,
          sizes.container,
          animated && 'animate-bounce-soft hover:scale-110 transition-transform'
        )}
      >
        <Icon className={cn(sizes.icon, colors.icon, 'drop-shadow-sm')} />
      </div>
      
      {count !== undefined && count > 0 && (
        <div
          className={cn(
            'absolute bg-red-500 text-white font-bold rounded-full flex items-center justify-center shadow-md',
            sizes.count
          )}
        >
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  );
};

// Quick badge variants
export const GoldStar = (props: Omit<StarBadgeProps, 'type' | 'color'>) => (
  <StarBadge {...props} type="star" color="gold" />
);

export const TrophyBadge = (props: Omit<StarBadgeProps, 'type'>) => (
  <StarBadge {...props} type="trophy" color="gold" />
);

export const MedalBadge = ({ rank = 1, ...props }: Omit<StarBadgeProps, 'type' | 'color'> & { rank?: 1 | 2 | 3 }) => {
  const colorMap = { 1: 'gold', 2: 'silver', 3: 'bronze' } as const;
  return <StarBadge {...props} type="medal" color={colorMap[rank]} />;
};
