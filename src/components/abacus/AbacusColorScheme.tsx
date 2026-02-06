import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Palette, Check, Sparkles } from 'lucide-react';

export type AbacusColorScheme = 'classic' | 'ocean' | 'sunset' | 'forest' | 'candy' | 'mono' | 'rainbow' | 'royal' | 'neon' | 'earth' | 'sakura' | 'golden';

interface ColorSchemeOption {
  id: AbacusColorScheme;
  name: string;
  description: string;
  upperBead: string;
  lowerBeads: string[];
  frame: string;
}

const CLASSIC_FRAME = 'linear-gradient(145deg, #1A0F08 0%, #2C1D12 20%, #1A0F08 50%, #0D0704 100%)';

export const colorSchemes: ColorSchemeOption[] = [
  {
    id: 'classic',
     name: '🪵 Klassik',
     description: 'Tabiiy yog\'och',
     upperBead: '#6B3A2A',
     lowerBeads: ['#8B4513', '#7A3B10', '#6B3A2A', '#5C2E0E'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'ocean',
     name: '🌊 Okean',
     description: "Moviy to'lqinlar",
     upperBead: '#0E7490',
     lowerBeads: ['#0891B2', '#06B6D4', '#22D3EE', '#0E7490'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'sunset',
     name: '🌅 Quyosh',
     description: 'Issiq ranglar',
     upperBead: '#B45309',
     lowerBeads: ['#D97706', '#C2410C', '#B45309', '#92400E'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'forest',
     name: "🌲 O'rmon",
     description: 'Tabiat ranglari',
     upperBead: '#166534',
     lowerBeads: ['#15803D', '#166534', '#14532D', '#1B5E3A'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'candy',
     name: '🍬 Shirinlik',
     description: "Qand ranglar",
     upperBead: '#BE185D',
     lowerBeads: ['#DB2777', '#E11D48', '#BE185D', '#9D174D'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'mono',
     name: '⚫ Oddiy',
     description: 'Klassik kulrang',
     upperBead: '#4B5563',
     lowerBeads: ['#6B7280', '#4B5563', '#374151', '#4B5563'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'rainbow',
     name: '🌈 Kamalak',
     description: 'Barcha ranglar!',
     upperBead: '#7C3AED',
     lowerBeads: ['#DC2626', '#D97706', '#16A34A', '#2563EB'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'royal',
     name: '👑 Qirollik',
     description: "Oltin va binafsha",
     upperBead: '#7C3AED',
     lowerBeads: ['#B45309', '#D97706', '#92400E', '#B45309'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'neon',
     name: '✨ Neon',
     description: "Yorug'lik ranglari",
     upperBead: '#0891B2',
     lowerBeads: ['#C026D3', '#16A34A', '#CA8A04', '#EA580C'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'earth',
     name: '🌍 Yer',
     description: 'Tabiiy ranglar',
     upperBead: '#78350F',
     lowerBeads: ['#92400E', '#A16207', '#854D0E', '#78350F'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'sakura',
     name: '🌸 Sakura',
     description: "Bahor gullari",
     upperBead: '#BE185D',
     lowerBeads: ['#DB2777', '#E879A8', '#BE185D', '#9D174D'],
     frame: CLASSIC_FRAME,
  },
  {
    id: 'golden',
     name: '🏆 Oltin',
     description: 'Qimmatbaho ranglar',
     upperBead: '#A16207',
     lowerBeads: ['#CA8A04', '#B45309', '#A16207', '#854D0E'],
     frame: CLASSIC_FRAME,
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
