import { MathSection, getSectionInfo } from '@/lib/mathGenerator';
import { Card } from './ui/card';
import { Plus, X, Divide, Shuffle, Sparkles } from 'lucide-react';

interface SectionCardProps {
  section: MathSection;
  onClick: () => void;
  isActive?: boolean;
}

const SectionIcon = ({ section, className = '' }: { section: MathSection; className?: string }) => {
  const iconClass = `h-7 w-7 ${className}`;
  
  switch (section) {
    case 'add-sub':
      return <Plus className={iconClass} strokeWidth={2.5} />;
    case 'multiply':
      return <X className={iconClass} strokeWidth={2.5} />;
    case 'divide':
      return <Divide className={iconClass} strokeWidth={2.5} />;
    case 'mix':
      return <Shuffle className={iconClass} strokeWidth={2.5} />;
  }
};

export const SectionCard = ({ section, onClick, isActive }: SectionCardProps) => {
  const info = getSectionInfo(section);
  
  const colorConfig = {
    primary: {
      bg: 'bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5',
      border: 'border-primary/40 hover:border-primary',
      iconBg: 'gradient-primary shadow-glow',
      glow: 'shadow-glow',
      badge: 'bg-primary/10 text-primary',
    },
    accent: {
      bg: 'bg-gradient-to-br from-accent/15 via-accent/10 to-accent/5',
      border: 'border-accent/40 hover:border-accent',
      iconBg: 'gradient-accent shadow-accent-glow',
      glow: 'shadow-accent-glow',
      badge: 'bg-accent/10 text-accent',
    },
    success: {
      bg: 'bg-gradient-to-br from-success/15 via-success/10 to-success/5',
      border: 'border-success/40 hover:border-success',
      iconBg: 'bg-success',
      glow: 'shadow-glow',
      badge: 'bg-success/10 text-success',
    },
    warning: {
      bg: 'bg-gradient-to-br from-warning/15 via-warning/10 to-warning/5',
      border: 'border-warning/40 hover:border-warning',
      iconBg: 'bg-warning',
      glow: '',
      badge: 'bg-warning/10 text-warning',
    },
  };

  const colors = colorConfig[info.color];

  return (
    <Card
      variant="section"
      onClick={onClick}
      className={`group relative overflow-hidden p-6 ${colors.bg} ${colors.border} transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
        isActive ? `ring-2 ring-primary ${colors.glow}` : ''
      }`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-background/50 to-transparent rounded-bl-full opacity-50" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-2xl" />
      
      <div className="relative flex flex-col items-center text-center gap-4">
        {/* Icon container with animation */}
        <div className={`relative h-16 w-16 rounded-2xl ${colors.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <SectionIcon section={section} className="text-primary-foreground" />
          {isActive && (
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {info.name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {info.description}
          </p>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
            Tanlangan
          </div>
        )}
      </div>
    </Card>
  );
};
