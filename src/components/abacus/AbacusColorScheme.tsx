import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Palette, Check, Sparkles } from 'lucide-react';

export type AbacusColorScheme = 'classic' | 'ocean' | 'sunset' | 'forest' | 'candy' | 'mono';

interface ColorSchemeOption {
  id: AbacusColorScheme;
  name: string;
  description: string;
  upperBead: string;
  lowerBeads: string[];
  frame: string;
}

export const colorSchemes: ColorSchemeOption[] = [
  {
    id: 'classic',
    name: 'Klassik',
    description: 'An\'anaviy ranglar',
    upperBead: '#6CBE45',
    lowerBeads: ['#EF5350', '#FFA726', '#FFEE58', '#26C6DA'],
    frame: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
  },
  {
    id: 'ocean',
    name: 'Okean',
    description: "Ko'k va yashil tonlar",
    upperBead: '#0EA5E9',
    lowerBeads: ['#06B6D4', '#14B8A6', '#10B981', '#22D3EE'],
    frame: 'linear-gradient(135deg, #164E63 0%, #0F172A 100%)',
  },
  {
    id: 'sunset',
    name: 'Quyosh botishi',
    description: 'Issiq ranglar',
    upperBead: '#F97316',
    lowerBeads: ['#EF4444', '#F59E0B', '#FBBF24', '#FB923C'],
    frame: 'linear-gradient(135deg, #7C2D12 0%, #1C1917 100%)',
  },
  {
    id: 'forest',
    name: "O'rmon",
    description: 'Tabiat ranglari',
    upperBead: '#22C55E',
    lowerBeads: ['#84CC16', '#A3E635', '#BEF264', '#4ADE80'],
    frame: 'linear-gradient(135deg, #14532D 0%, #052E16 100%)',
  },
  {
    id: 'candy',
    name: 'Shirinlik',
    description: 'Yorqin ranglar',
    upperBead: '#A855F7',
    lowerBeads: ['#EC4899', '#F472B6', '#C084FC', '#E879F9'],
    frame: 'linear-gradient(135deg, #581C87 0%, #1E1B4B 100%)',
  },
  {
    id: 'mono',
    name: 'Monoxrom',
    description: 'Oq-qora ranglar',
    upperBead: '#FFFFFF',
    lowerBeads: ['#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280'],
    frame: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
  },
];

interface AbacusColorSchemeSelectorProps {
  selectedScheme: AbacusColorScheme;
  onSelect: (scheme: AbacusColorScheme) => void;
}

export const AbacusColorSchemeSelector = ({
  selectedScheme,
  onSelect,
}: AbacusColorSchemeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {colorSchemes.map((scheme) => {
        const isSelected = selectedScheme === scheme.id;
        
        return (
          <motion.button
            key={scheme.id}
            onClick={() => onSelect(scheme.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl",
              "transition-all duration-300",
              "border-2",
              isSelected
                ? "border-primary shadow-lg shadow-primary/20 bg-primary/5"
                : "border-border/30 hover:border-border/60 bg-card/50"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Mini abacus preview */}
            <div
              className="w-full aspect-[4/3] rounded-xl flex items-center justify-center gap-2 p-3"
              style={{ background: scheme.frame }}
            >
              {/* Upper bead preview */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-4 h-3 sm:w-5 sm:h-4 rounded-full shadow-md"
                  style={{ backgroundColor: scheme.upperBead }}
                />
                <div className="w-4 h-0.5 sm:w-5 bg-gray-400 rounded-full" />
                {/* Lower beads */}
                <div className="flex flex-col gap-0.5">
                  {scheme.lowerBeads.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-2.5 sm:w-5 sm:h-3 rounded-full shadow-md"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Second column */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-4 h-3 sm:w-5 sm:h-4 rounded-full shadow-md"
                  style={{ backgroundColor: scheme.upperBead }}
                />
                <div className="w-4 h-0.5 sm:w-5 bg-gray-400 rounded-full" />
                <div className="flex flex-col gap-0.5">
                  {scheme.lowerBeads.slice(0, 2).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-2.5 sm:w-5 sm:h-3 rounded-full shadow-md"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Scheme name and description */}
            <div className="text-center">
              <p className={cn(
                "text-sm font-bold",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {scheme.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {scheme.description}
              </p>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <motion.div
                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// Get color palette for a given scheme
export const getColorPaletteForScheme = (scheme: AbacusColorScheme) => {
  const schemeData = colorSchemes.find(s => s.id === scheme) || colorSchemes[0];
  
  return {
    upperBead: schemeData.upperBead,
    lowerBeads: schemeData.lowerBeads,
    frame: schemeData.frame,
  };
};
