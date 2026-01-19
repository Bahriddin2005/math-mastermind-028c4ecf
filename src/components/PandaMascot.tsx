import { cn } from '@/lib/utils';
import pandaImage from '@/assets/panda-mascot.png';

interface PandaMascotProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sad';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  animate?: boolean;
  showMessage?: boolean;
}

export const PandaMascot = ({ 
  mood = 'happy', 
  size = 'md', 
  message,
  className,
  animate = true,
  showMessage = true
}: PandaMascotProps) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const getAnimationClass = () => {
    switch (mood) {
      case 'celebrating': return 'animate-bounce';
      case 'excited': return 'animate-pulse';
      case 'thinking': return 'animate-wiggle';
      default: return animate ? 'animate-bounce-soft' : '';
    }
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

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {/* Speech bubble */}
      {message && showMessage && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-lg border-2 border-primary/30 max-w-[200px] z-10 animate-bounce-soft">
          <p className="text-sm font-medium text-center text-gray-800 dark:text-white">{message}</p>
          {/* Speech bubble tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-r-2 border-b-2 border-primary/30 rotate-45" />
        </div>
      )}
      
      {/* Panda Mascot */}
      <div className={cn(
        sizeClasses[size],
        'relative',
        getAnimationClass()
      )}>
        {/* Glow effect for celebrating */}
        {mood === 'celebrating' && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-green-400/30 to-yellow-400/30 rounded-full blur-xl animate-pulse" />
        )}
        
        <img 
          src={pandaImage} 
          alt="IqroMax Panda" 
          className="w-full h-full object-contain drop-shadow-xl relative z-10"
        />

        {/* Celebrating sparkles */}
        {mood === 'celebrating' && (
          <>
            <div className="absolute -top-2 -left-2 text-xl animate-ping">✨</div>
            <div className="absolute -top-1 -right-2 text-lg animate-ping" style={{ animationDelay: '0.2s' }}>⭐</div>
            <div className="absolute -bottom-1 -left-1 text-lg animate-ping" style={{ animationDelay: '0.4s' }}>🌟</div>
            <div className="absolute -bottom-2 -right-1 text-xl animate-ping" style={{ animationDelay: '0.6s' }}>💫</div>
          </>
        )}

        {/* Excited hearts */}
        {mood === 'excited' && (
          <>
            <div className="absolute -top-1 -right-1 text-sm animate-bounce">💚</div>
            <div className="absolute -top-2 left-0 text-xs animate-bounce" style={{ animationDelay: '0.3s' }}>💚</div>
          </>
        )}
      </div>
    </div>
  );
};

// Quick mascot variants for different scenarios
export const HappyPanda = (props: Omit<PandaMascotProps, 'mood'>) => <PandaMascot {...props} mood="happy" />;
export const ExcitedPanda = (props: Omit<PandaMascotProps, 'mood'>) => <PandaMascot {...props} mood="excited" />;
export const ThinkingPanda = (props: Omit<PandaMascotProps, 'mood'>) => <PandaMascot {...props} mood="thinking" />;
export const SadPanda = (props: Omit<PandaMascotProps, 'mood'>) => <PandaMascot {...props} mood="sad" />;
export const CelebratingPanda = (props: Omit<PandaMascotProps, 'mood'>) => <PandaMascot {...props} mood="celebrating" />;
