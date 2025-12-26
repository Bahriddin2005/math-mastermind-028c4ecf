import { MathSection, getSectionInfo } from '@/lib/mathGenerator';
import { Card } from './ui/card';
import { Plus, X, Divide, Shuffle } from 'lucide-react';

interface SectionCardProps {
  section: MathSection;
  onClick: () => void;
  isActive?: boolean;
}

const SectionIcon = ({ section, className = '' }: { section: MathSection; className?: string }) => {
  const iconClass = `h-8 w-8 ${className}`;
  
  switch (section) {
    case 'add-sub':
      return <Plus className={iconClass} />;
    case 'multiply':
      return <X className={iconClass} />;
    case 'divide':
      return <Divide className={iconClass} />;
    case 'mix':
      return <Shuffle className={iconClass} />;
  }
};

export const SectionCard = ({ section, onClick, isActive }: SectionCardProps) => {
  const info = getSectionInfo(section);
  
  const colorStyles = {
    primary: 'from-primary/10 to-primary/5 border-primary/30 hover:border-primary',
    accent: 'from-accent/10 to-accent/5 border-accent/30 hover:border-accent',
    success: 'from-success/10 to-success/5 border-success/30 hover:border-success',
    warning: 'from-warning/10 to-warning/5 border-warning/30 hover:border-warning',
  };

  const iconBgStyles = {
    primary: 'gradient-primary',
    accent: 'gradient-accent',
    success: 'bg-success',
    warning: 'bg-warning',
  };

  return (
    <Card
      variant="section"
      onClick={onClick}
      className={`p-6 bg-gradient-to-br ${colorStyles[info.color]} ${
        isActive ? 'ring-2 ring-primary shadow-glow' : ''
      }`}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`h-16 w-16 rounded-2xl ${iconBgStyles[info.color]} flex items-center justify-center shadow-md`}>
          <SectionIcon section={section} className="text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">{info.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
        </div>
      </div>
    </Card>
  );
};
