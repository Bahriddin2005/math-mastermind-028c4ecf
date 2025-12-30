import { LucideIcon } from 'lucide-react';
import { Card } from './ui/card';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBgColor: 'primary' | 'accent' | 'warning' | 'success' | 'destructive';
  delay?: number;
}

const colorConfig = {
  primary: {
    iconBg: 'gradient-primary shadow-glow',
    iconColor: 'text-primary-foreground',
    valueBg: 'bg-primary/5',
    valueColor: 'text-primary',
    borderHover: 'hover:border-primary/50',
  },
  accent: {
    iconBg: 'gradient-accent shadow-accent-glow',
    iconColor: 'text-accent-foreground',
    valueBg: 'bg-accent/5',
    valueColor: 'text-accent',
    borderHover: 'hover:border-accent/50',
  },
  warning: {
    iconBg: 'bg-warning text-warning-foreground',
    iconColor: 'text-warning-foreground',
    valueBg: 'bg-warning/5',
    valueColor: 'text-warning',
    borderHover: 'hover:border-warning/50',
  },
  success: {
    iconBg: 'bg-success',
    iconColor: 'text-success-foreground',
    valueBg: 'bg-success/5',
    valueColor: 'text-success',
    borderHover: 'hover:border-success/50',
  },
  destructive: {
    iconBg: 'bg-destructive/20',
    iconColor: 'text-destructive',
    valueBg: 'bg-destructive/5',
    valueColor: 'text-destructive',
    borderHover: 'hover:border-destructive/50',
  },
};

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  iconBgColor,
  delay = 0,
}: StatsCardProps) => {
  const colors = colorConfig[iconBgColor];

  return (
    <Card
      className={`group relative overflow-hidden p-3 sm:p-4 md:p-5 bg-gradient-to-br from-card via-card to-secondary/20 border border-border/40 opacity-0 animate-slide-up hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${colors.borderHover}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Background decoration */}
      <div className={`absolute -top-8 -right-8 w-20 sm:w-24 h-20 sm:h-24 ${colors.valueBg} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />
      
      <div className="relative flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
        {/* Icon container */}
        <div className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${colors.iconColor}`} strokeWidth={2} />
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium truncate mb-0.5">
            {label}
          </p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-display font-bold ${colors.valueColor} tracking-tight`}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};