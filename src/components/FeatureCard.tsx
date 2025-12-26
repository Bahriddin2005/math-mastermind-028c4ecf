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
      className={`group relative overflow-hidden p-6 bg-gradient-to-br from-card via-card to-secondary/30 border border-border/40 hover:shadow-xl transition-all duration-300 opacity-0 animate-slide-up cursor-pointer hover:-translate-y-1 ${colors.borderHover} ${colors.glow}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      onClick={onClick}
    >
      {/* Background decorations */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-secondary/50 to-transparent rounded-full opacity-50" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-xl" />
      
      <div className="relative space-y-4">
        {/* Header with icon and category */}
        <div className="flex items-start justify-between">
          <div className={`h-14 w-14 rounded-2xl ${colors.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-7 w-7 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.categoryBg}`}>
            {category}
          </span>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-xl text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
        
        {/* Button */}
        <Button
          size="sm"
          className={`w-full gap-2 font-semibold ${colors.buttonClass} group-hover:gap-3 transition-all`}
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