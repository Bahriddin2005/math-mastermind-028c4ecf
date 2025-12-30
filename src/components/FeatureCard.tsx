import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface FeatureCardProps {
  category: string;
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  iconBgColor: 'primary' | 'accent' | 'warning' | 'success';
  onClick?: () => void;
  delay?: number;
}

const colorConfig = {
  primary: {
    iconBg: 'gradient-primary shadow-glow',
    categoryBg: 'bg-primary/10 text-primary',
    borderHover: 'hover:border-primary/50',
    buttonClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    glow: 'group-hover:shadow-glow',
  },
  accent: {
    iconBg: 'gradient-accent shadow-accent-glow',
    categoryBg: 'bg-accent/10 text-accent',
    borderHover: 'hover:border-accent/50',
    buttonClass: 'bg-accent hover:bg-accent/90 text-accent-foreground',
    glow: 'group-hover:shadow-accent-glow',
  },
  warning: {
    iconBg: 'bg-warning',
    categoryBg: 'bg-warning/10 text-warning',
    borderHover: 'hover:border-warning/50',
    buttonClass: 'bg-warning hover:bg-warning/90 text-warning-foreground',
    glow: '',
  },
  success: {
    iconBg: 'bg-success',
    categoryBg: 'bg-success/10 text-success',
    borderHover: 'hover:border-success/50',
    buttonClass: 'bg-success hover:bg-success/90 text-success-foreground',
    glow: '',
  },
};

export const FeatureCard = ({
  category,
  title,
  description,
  buttonText,
  icon: Icon,
  iconBgColor,
  onClick,
  delay = 0,
}: FeatureCardProps) => {
  const colors = colorConfig[iconBgColor];

  return (
    <Card
      className={`group relative overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-card via-card to-secondary/30 border border-border/40 hover:shadow-xl transition-all duration-300 opacity-0 animate-slide-up cursor-pointer hover:-translate-y-1 ${colors.borderHover} ${colors.glow}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      onClick={onClick}
    >
      {/* Background decorations */}
      <div className="absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-secondary/50 to-transparent rounded-full opacity-50" />
      <div className="absolute -bottom-6 -left-6 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-xl" />
      
      <div className="relative space-y-3 sm:space-y-4">
        {/* Header with icon and category */}
        <div className="flex items-start justify-between gap-2">
          <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl ${colors.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${colors.categoryBg} whitespace-nowrap`}>
            {category}
          </span>
        </div>
        
        {/* Content */}
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="font-display font-bold text-base sm:text-xl text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
        
        {/* Button */}
        <Button
          size="sm"
          className={`w-full gap-2 font-semibold h-10 sm:h-9 text-sm ${colors.buttonClass} group-hover:gap-3 transition-all`}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          {buttonText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
};