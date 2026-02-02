import { motion } from 'framer-motion';
import { Eye, EyeOff, HelpCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AbacusMode } from './RealisticAbacus';

interface AbacusModeSelectorProps {
  mode: AbacusMode;
  onChange: (mode: AbacusMode) => void;
  disabled?: boolean;
}

const modes = [
  {
    id: 'beginner' as AbacusMode,
    name: "Boshlang'ich",
    icon: Eye,
    description: 'Raqamlar ko\'rinadi',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'mental' as AbacusMode,
    name: 'Mental',
    icon: EyeOff,
    description: 'Raqamlar yashirin',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'test' as AbacusMode,
    name: 'Test',
    icon: HelpCircle,
    description: 'Savol-javob',
    color: 'from-purple-500 to-pink-600',
  },
];

export const AbacusModeSelector = ({
  mode,
  onChange,
  disabled = false,
}: AbacusModeSelectorProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {modes.map((m) => {
        const isActive = mode === m.id;
        const Icon = m.icon;
        
        return (
          <motion.button
            key={m.id}
            onClick={() => !disabled && onChange(m.id)}
            disabled={disabled}
            className={cn(
              "relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl",
              "transition-all duration-200",
              "border-2",
              isActive 
                ? "border-primary bg-primary/10 shadow-lg" 
                : "border-border/50 bg-card/50 hover:bg-card hover:border-border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-xl opacity-20",
                  "bg-gradient-to-r",
                  m.color
                )}
                layoutId="activeMode"
                transition={{ duration: 0.2 }}
              />
            )}
            
            <Icon className={cn(
              "w-4 h-4 sm:w-5 sm:h-5",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            
            <div className="text-left">
              <div className={cn(
                "text-sm font-medium",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {m.name}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                {m.description}
              </div>
            </div>
            
            {isActive && (
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
