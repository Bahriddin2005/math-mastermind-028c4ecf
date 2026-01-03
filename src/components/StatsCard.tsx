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
    valueBg: 'bg-primary/5 dark:bg-primary/10',
    valueColor: 'text-primary',
    borderHover: 'hover:border-primary/50 dark:hover:border-primary/60',
    cardGradient: 'from-card via-card to-primary/5 dark:from-card dark:via-card/80 dark:to-primary/10',
  },
  accent: {
    iconBg: 'gradient-accent shadow-accent-glow',
    iconColor: 'text-accent-foreground',
    valueBg: 'bg-accent/5 dark:bg-accent/10',
    valueColor: 'text-accent',
    borderHover: 'hover:border-accent/50 dark:hover:border-accent/60',
    cardGradient: 'from-card via-card to-accent/5 dark:from-card dark:via-card/80 dark:to-accent/10',
  },
  warning: {
    iconBg: 'bg-warning text-warning-foreground dark:bg-warning/90',
    iconColor: 'text-warning-foreground',
    valueBg: 'bg-warning/5 dark:bg-warning/10',
    valueColor: 'text-warning dark:text-warning',
    borderHover: 'hover:border-warning/50 dark:hover:border-warning/60',
    cardGradient: 'from-card via-card to-warning/5 dark:from-card dark:via-card/80 dark:to-warning/10',
  },
  success: {
    iconBg: 'bg-success dark:bg-success/90',
    iconColor: 'text-success-foreground',
    valueBg: 'bg-success/5 dark:bg-success/10',
    valueColor: 'text-success dark:text-success',
    borderHover: 'hover:border-success/50 dark:hover:border-success/60',
    cardGradient: 'from-card via-card to-success/5 dark:from-card dark:via-card/80 dark:to-success/10',
  },
  destructive: {
    iconBg: 'bg-destructive/20 dark:bg-destructive/30',
    iconColor: 'text-destructive dark:text-destructive',
    valueBg: 'bg-destructive/5 dark:bg-destructive/10',
    valueColor: 'text-destructive dark:text-destructive',
    borderHover: 'hover:border-destructive/50 dark:hover:border-destructive/60',
    cardGradient: 'from-card via-card to-destructive/5 dark:from-card dark:via-card/80 dark:to-destructive/10',
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
      className={`group relative overflow-hidden p-2.5 xs:p-3 sm:p-4 md:p-5 bg-gradient-to-br ${colors.cardGradient} border border-border/40 dark:border-border/30 opacity-0 animate-slide-up hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 min-h-[80px] xs:min-h-[90px] sm:h-[100px] flex flex-col justify-center backdrop-blur-sm ${colors.borderHover}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Background decoration */}
      <div className={`absolute -top-6 -right-6 xs:-top-8 xs:-right-8 w-16 xs:w-20 sm:w-24 h-16 xs:h-20 sm:h-24 ${colors.valueBg} rounded-full blur-2xl opacity-50 dark:opacity-60 group-hover:opacity-80 transition-opacity`} />
      
      <div className="relative flex items-center gap-2 xs:gap-3 sm:gap-4">
        {/* Icon container - smaller on mobile */}
        <div className={`h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg xs:rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          <Icon className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${colors.iconColor}`} strokeWidth={2} />
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium truncate mb-0.5">
            {label}
          </p>
          <p className={`text-base xs:text-lg sm:text-2xl md:text-3xl font-display font-bold ${colors.valueColor} tracking-tight`}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};