import { cn } from '@/lib/utils';

interface MascotProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'sad' | 'celebrating';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  animate?: boolean;
}

export const Mascot = ({ 
  mood = 'happy', 
  size = 'md', 
  message,
  className,
  animate = true 
}: MascotProps) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'thinking': return '🤔';
      case 'sad': return '😢';
      case 'celebrating': return '🎉';
      default: return '😊';
    }
  };

  const getEyeStyle = () => {
    switch (mood) {
      case 'happy': return 'scale-y-75'; // Smiling eyes
      case 'excited': return 'scale-110'; // Big eyes
      case 'thinking': return 'translate-x-1'; // Looking to side
      case 'sad': return 'scale-y-50 translate-y-1';
      case 'celebrating': return 'scale-125';
      default: return '';
    }
  };

  const getMouthPath = () => {
    switch (mood) {
      case 'happy': return 'M 35 70 Q 50 85 65 70'; // Smile
      case 'excited': return 'M 30 65 Q 50 90 70 65'; // Big smile
      case 'thinking': return 'M 40 75 L 60 73'; // Slight line
      case 'sad': return 'M 35 80 Q 50 65 65 80'; // Frown
      case 'celebrating': return 'M 30 60 Q 50 95 70 60'; // Huge smile
      default: return 'M 35 70 Q 50 85 65 70';
    }
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-lg border-2 border-kids-purple/30 max-w-[200px] z-10 animate-bounce-soft">
          <p className="text-sm font-medium text-center text-gray-800 dark:text-white">{message}</p>
          {/* Speech bubble tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-r-2 border-b-2 border-kids-purple/30 rotate-45" />
        </div>
      )}
      
      {/* Robot Mascot */}
      <div className={cn(
        sizeClasses[size],
        'relative',
        animate && mood === 'celebrating' && 'animate-celebrate',
        animate && mood !== 'celebrating' && 'animate-bounce-soft'
      )}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {/* Background glow */}
          <defs>
            <radialGradient id="mascotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Glow background */}
          <circle cx="50" cy="50" r="48" fill="url(#mascotGlow)" />

          {/* Antenna */}
          <line x1="50" y1="8" x2="50" y2="18" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="6" r="4" fill="#FBBF24" className={animate ? 'animate-pulse' : ''} filter="url(#glow)" />

          {/* Head */}
          <rect x="20" y="18" width="60" height="45" rx="15" fill="url(#headGradient)" />
          
          {/* Face plate */}
          <rect x="28" y="26" width="44" height="32" rx="10" fill="#F5F3FF" />

          {/* Eyes */}
          <g className={cn('transition-transform duration-300', getEyeStyle())}>
            <circle cx="38" cy="42" r="6" fill="#1F2937" />
            <circle cx="62" cy="42" r="6" fill="#1F2937" />
            {/* Eye shine */}
            <circle cx="40" cy="40" r="2" fill="white" />
            <circle cx="64" cy="40" r="2" fill="white" />
          </g>

          {/* Blush */}
          {(mood === 'happy' || mood === 'excited' || mood === 'celebrating') && (
            <>
              <ellipse cx="30" cy="50" rx="5" ry="3" fill="#FDA4AF" opacity="0.6" />
              <ellipse cx="70" cy="50" rx="5" ry="3" fill="#FDA4AF" opacity="0.6" />
            </>
          )}

          {/* Mouth */}
          <path 
            d={getMouthPath()} 
            fill="none" 
            stroke="#1F2937" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Body */}
          <rect x="30" y="65" width="40" height="25" rx="8" fill="url(#bodyGradient)" />
          
          {/* Belly button/screen */}
          <rect x="40" y="72" width="20" height="12" rx="3" fill="#F5F3FF" />
          <rect x="43" y="75" width="14" height="6" rx="2" fill="#10B981" className={animate ? 'animate-pulse' : ''} />

          {/* Arms */}
          <ellipse cx="22" cy="75" rx="6" ry="8" fill="#8B5CF6" />
          <ellipse cx="78" cy="75" rx="6" ry="8" fill="#8B5CF6" />

          {/* Legs */}
          <rect x="35" y="88" width="10" height="10" rx="3" fill="#7C3AED" />
          <rect x="55" y="88" width="10" height="10" rx="3" fill="#7C3AED" />

          {/* Celebrating sparkles */}
          {mood === 'celebrating' && (
            <>
              <circle cx="15" cy="20" r="3" fill="#FBBF24" className="animate-ping" />
              <circle cx="85" cy="25" r="2" fill="#F472B6" className="animate-ping" style={{ animationDelay: '0.2s' }} />
              <circle cx="10" cy="45" r="2" fill="#34D399" className="animate-ping" style={{ animationDelay: '0.4s' }} />
              <circle cx="90" cy="50" r="3" fill="#60A5FA" className="animate-ping" style={{ animationDelay: '0.6s' }} />
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

// Quick mascot variants for different scenarios
export const HappyMascot = (props: Omit<MascotProps, 'mood'>) => <Mascot {...props} mood="happy" />;
export const ExcitedMascot = (props: Omit<MascotProps, 'mood'>) => <Mascot {...props} mood="excited" />;
export const ThinkingMascot = (props: Omit<MascotProps, 'mood'>) => <Mascot {...props} mood="thinking" />;
export const SadMascot = (props: Omit<MascotProps, 'mood'>) => <Mascot {...props} mood="sad" />;
export const CelebratingMascot = (props: Omit<MascotProps, 'mood'>) => <Mascot {...props} mood="celebrating" />;
