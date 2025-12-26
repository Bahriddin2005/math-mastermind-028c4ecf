import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
}

export const TimerDisplay = ({ timeLeft, totalTime, isActive }: TimerDisplayProps) => {
  const percentage = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      {/* Background track */}
      <div className="h-4 bg-secondary rounded-full overflow-hidden">
        {/* Progress bar */}
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear rounded-full',
            isCritical ? 'bg-destructive animate-pulse' :
            isLow ? 'bg-warning' : 'gradient-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Time display */}
      <div className={cn(
        'mt-2 text-center font-display font-bold text-2xl',
        isCritical ? 'text-destructive animate-pulse' :
        isLow ? 'text-warning' : 'text-foreground'
      )}>
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};
