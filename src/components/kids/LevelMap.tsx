import { cn } from '@/lib/utils';
import { Lock, Star, Check, Play } from 'lucide-react';

interface Level {
  id: string;
  number: number;
  title: string;
  status: 'locked' | 'available' | 'completed';
  stars?: number;
}

interface LevelMapProps {
  levels: Level[];
  onLevelClick: (level: Level) => void;
  className?: string;
}

const colors = [
  'from-kids-purple to-violet-600',
  'from-kids-blue to-cyan-500',
  'from-kids-green to-teal-500',
  'from-kids-yellow to-orange-500',
  'from-kids-pink to-rose-500',
  'from-orange-400 to-red-500',
];

export const LevelMap = ({ levels, onLevelClick, className }: LevelMapProps) => {
  return (
    <div className={cn('relative py-8', className)}>
      {/* Winding path */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
      </svg>

      {/* Levels grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6">
        {levels.map((level, index) => {
          const colorIndex = index % colors.length;
          const isLocked = level.status === 'locked';
          const isCompleted = level.status === 'completed';
          const isAvailable = level.status === 'available';

          return (
            <div key={level.id} className="relative">
              {/* Connector line to next level */}
              {index < levels.length - 1 && (
                <div
                  className={cn(
                    'absolute top-1/2 left-full w-4 sm:w-6 h-1 -translate-y-1/2 z-0',
                    isCompleted ? 'bg-gradient-to-r from-kids-green to-emerald-400' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  style={{
                    display: (index + 1) % (window.innerWidth >= 768 ? 5 : window.innerWidth >= 640 ? 4 : 3) === 0 ? 'none' : 'block'
                  }}
                />
              )}

              <button
                onClick={() => !isLocked && onLevelClick(level)}
                disabled={isLocked}
                className={cn(
                  'relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl transition-all duration-300',
                  'flex flex-col items-center justify-center',
                  'shadow-lg hover:shadow-xl',
                  isLocked && 'cursor-not-allowed opacity-60 grayscale',
                  !isLocked && 'hover:scale-110 hover:-translate-y-1 active:scale-95',
                  'focus:outline-none focus:ring-4 focus:ring-white/50'
                )}
              >
                {/* Background */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-2xl bg-gradient-to-br',
                    isLocked ? 'from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700' : colors[colorIndex]
                  )}
                />

                {/* Shine effect */}
                {!isLocked && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-white">
                  {isLocked ? (
                    <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : isCompleted ? (
                    <Check className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : isAvailable ? (
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-bold">{level.number}</span>
                  )}
                </div>

                {/* Level number badge */}
                <div
                  className={cn(
                    'absolute -bottom-2 left-1/2 -translate-x-1/2',
                    'bg-white dark:bg-gray-800 rounded-full px-2 py-0.5',
                    'text-xs font-bold shadow-md',
                    isCompleted ? 'text-kids-green' : isAvailable ? 'text-kids-purple' : 'text-gray-400'
                  )}
                >
                  {level.number}
                </div>

                {/* Stars for completed levels */}
                {isCompleted && level.stars && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex">
                    {[1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4 -mx-0.5',
                          i <= level.stars! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Glow effect for available level */}
                {isAvailable && (
                  <div className="absolute inset-0 rounded-2xl animate-pulse bg-white/20" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
