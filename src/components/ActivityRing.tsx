import { useMemo } from 'react';

interface ActivityRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'accent' | 'success' | 'warning';
  label?: string;
  value?: string | number;
  icon?: React.ReactNode;
}

const colorMap = {
  primary: {
    stroke: 'stroke-primary',
    bg: 'stroke-primary/20',
    text: 'text-primary',
    glow: 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]',
  },
  accent: {
    stroke: 'stroke-accent',
    bg: 'stroke-accent/20',
    text: 'text-accent',
    glow: 'drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]',
  },
  success: {
    stroke: 'stroke-success',
    bg: 'stroke-success/20',
    text: 'text-success',
    glow: 'drop-shadow-[0_0_8px_hsl(var(--success)/0.5)]',
  },
  warning: {
    stroke: 'stroke-warning',
    bg: 'stroke-warning/20',
    text: 'text-warning',
    glow: 'drop-shadow-[0_0_8px_hsl(var(--warning)/0.5)]',
  },
};

export const ActivityRing = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color = 'primary',
  label,
  value,
  icon,
}: ActivityRingProps) => {
  const colors = colorMap[color];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  const gradientId = useMemo(() => `ring-gradient-${color}-${Math.random().toString(36).substr(2, 9)}`, [color]);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`hsl(var(--${color}))`} />
            <stop offset="100%" stopColor={`hsl(var(--${color}) / 0.7)`} />
          </linearGradient>
        </defs>
        
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.bg}
        />
        
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-700 ease-out ${colors.glow}`}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && <div className={`mb-1 ${colors.text}`}>{icon}</div>}
        {value !== undefined && (
          <span className={`text-2xl font-display font-bold ${colors.text}`}>
            {value}
          </span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground font-medium">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};