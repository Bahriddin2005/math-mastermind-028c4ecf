import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AbacusTheme } from './RealisticAbacus';

interface AbacusThemeSelectorProps {
  theme: AbacusTheme;
  onChange: (theme: AbacusTheme) => void;
}

const themes = [
  {
    id: 'classic' as AbacusTheme,
    name: 'Klassik',
    colors: ['#b45309', '#92400e', '#78350f'],
    beadColors: ['#dc2626', '#059669'],
  },
  {
    id: 'modern' as AbacusTheme,
    name: 'Zamonaviy',
    colors: ['#475569', '#334155', '#1e293b'],
    beadColors: ['#3b82f6', '#8b5cf6'],
  },
  {
    id: 'kids' as AbacusTheme,
    name: 'Bolalar',
    colors: ['#a855f7', '#ec4899', '#f97316'],
    beadColors: ['#fbbf24', '#34d399'],
  },
];

export const AbacusThemeSelector = ({
  theme,
  onChange,
}: AbacusThemeSelectorProps) => {
  return (
    <div className="flex justify-center gap-3">
      {themes.map((t) => {
        const isActive = theme === t.id;
        
        return (
          <motion.button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-2 rounded-xl",
              "transition-all duration-200",
              "border-2",
              isActive 
                ? "border-primary shadow-lg" 
                : "border-border/30 hover:border-border/60"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Mini abakus preview */}
            <div 
              className="w-12 h-10 rounded-lg flex items-center justify-center gap-1"
              style={{
                background: `linear-gradient(to bottom, ${t.colors.join(', ')})`,
              }}
            >
              {/* Mini beads */}
              <div className="flex flex-col gap-0.5">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.beadColors[0] }}
                />
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.beadColors[1] }}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.beadColors[0] }}
                />
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.beadColors[1] }}
                />
              </div>
            </div>
            
            <span className={cn(
              "text-xs font-medium",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {t.name}
            </span>
            
            {isActive && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
