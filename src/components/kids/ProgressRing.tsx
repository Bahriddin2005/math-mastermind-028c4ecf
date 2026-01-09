import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'green' | 'yellow' | 'pink';
  showLabel?: boolean;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

const colorClasses = {
  purple: 'stroke-kids-purple',
  blue: 'stroke-kids-blue',
  green: 'stroke-kids-green',
  yellow: 'stroke-kids-yellow',
  pink: 'stroke-kids-pink',
};

const bgColorClasses = {
  purple: 'stroke-kids-purple/20',
  blue: 'stroke-kids-blue/20',
  green: 'stroke-kids-green/20',
  yellow: 'stroke-kids-yellow/20',
  pink: 'stroke-kids-pink/20',
};

export const ProgressRing = ({
  progress,
  size = 'md',
  color = 'purple',
  showLabel = true,
  label,
  icon,
  className,
}: ProgressRingProps) => {
  const sizeConfig = {
    sm: { width: 60, stroke: 5, fontSize: 'text-sm' },
    md: { width: 80, stroke: 6, fontSize: 'text-lg' },
    lg: { width: 120, stroke: 8, fontSize: 'text-2xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          className={bgColorClasses[color]}
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          className={cn(colorClasses[color], 'transition-all duration-500 ease-out')}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon ? (
          icon
        ) : showLabel ? (
          <>
            <span className={cn('font-bold', config.fontSize)}>
              {Math.round(progress)}%
            </span>
            {label && (
              <span className="text-xs text-muted-foreground">{label}</span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
