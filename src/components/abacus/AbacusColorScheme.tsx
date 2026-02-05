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

export const colorSchemes: ColorSchemeOption[] = [
  {
    id: 'classic',
    name: 'Klassik',
    description: 'Qizil toshlar',
    upperBead: '#C0392B',
    lowerBeads: ['#E74C3C', '#E74C3C', '#E74C3C', '#E74C3C'],
    frame: 'linear-gradient(135deg, #3D4A5C 0%, #2C3644 50%, #1F2833 100%)',
  },
  {
    id: 'ocean',
    name: 'Okean',
    description: "Ko'k toshlar",
    upperBead: '#1A5276',
    lowerBeads: ['#3498DB', '#3498DB', '#3498DB', '#3498DB'],
    frame: 'linear-gradient(135deg, #164E63 0%, #0F172A 100%)',
  },
  {
    id: 'sunset',
    name: 'Quyosh botishi',
    description: 'Sariq toshlar',
    upperBead: '#D68910',
    lowerBeads: ['#F39C12', '#F39C12', '#F39C12', '#F39C12'],
    frame: 'linear-gradient(135deg, #7C2D12 0%, #1C1917 100%)',
  },
  {
    id: 'forest',
    name: "O'rmon",
    description: 'Yashil toshlar',
    upperBead: '#1E8449',
    lowerBeads: ['#27AE60', '#27AE60', '#27AE60', '#27AE60'],
    frame: 'linear-gradient(135deg, #14532D 0%, #052E16 100%)',
  },
  {
    id: 'candy',
    name: 'Shirinlik',
    description: 'Pushti toshlar',
    upperBead: '#C2185B',
    lowerBeads: ['#E91E63', '#E91E63', '#E91E63', '#E91E63'],
    frame: 'linear-gradient(135deg, #581C87 0%, #1E1B4B 100%)',
  },
  {
    id: 'mono',
    name: 'Monoxrom',
    description: 'Oq-qora ranglar',
    upperBead: '#5D6D7E',
    lowerBeads: ['#ABB2B9', '#ABB2B9', '#ABB2B9', '#ABB2B9'],
    frame: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
  },
  {
    id: 'rainbow',
    name: 'Kamalak',
    description: 'Binafsha toshlar',
    upperBead: '#6C3483',
    lowerBeads: ['#9B59B6', '#9B59B6', '#9B59B6', '#9B59B6'],
    frame: 'linear-gradient(135deg, #312E81 0%, #1E1B4B 100%)',
  },
  {
    id: 'royal',
    name: 'Qirollik',
    description: "Oltin toshlar",
    upperBead: '#B7950B',
    lowerBeads: ['#F1C40F', '#F1C40F', '#F1C40F', '#F1C40F'],
    frame: 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 100%)',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: "Yorqin neon ranglar",
    upperBead: '#00A8CC',
    lowerBeads: ['#00D4FF', '#00D4FF', '#00D4FF', '#00D4FF'],
    frame: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%)',
  },
  {
    id: 'earth',
    name: 'Yer',
    description: 'Tabiiy tuproq ranglari',
    upperBead: '#784212',
    lowerBeads: ['#A0522D', '#A0522D', '#A0522D', '#A0522D'],
    frame: 'linear-gradient(135deg, #451A03 0%, #1C1917 100%)',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: "Pushti gul ranglari",
    upperBead: '#D81B60',
    lowerBeads: ['#F06292', '#F06292', '#F06292', '#F06292'],
    frame: 'linear-gradient(135deg, #831843 0%, #500724 100%)',
  },
  {
    id: 'golden',
    name: 'Oltin',
    description: 'Qimmatbaho metallar',
    upperBead: '#CA6F1E',
    lowerBeads: ['#E67E22', '#E67E22', '#E67E22', '#E67E22'],
    frame: 'linear-gradient(135deg, #78350F 0%, #451A03 100%)',
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
