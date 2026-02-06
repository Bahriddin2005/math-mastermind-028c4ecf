import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AbacusColumn } from './AbacusColumn';
import { useSound } from '@/hooks/useSound';
import { useDeviceType } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { AbacusColorScheme } from './AbacusColorScheme';
import { getColorPaletteForScheme } from './AbacusColorScheme';

export type AbacusMode = 'beginner' | 'mental' | 'test';
export type AbacusTheme = 'classic' | 'modern' | 'kids';
export type AbacusOrientation = 'horizontal' | 'vertical';

interface ColumnState {
  upper: boolean;
  lower: number;
}

interface RealisticAbacusProps {
  columns?: number;
  value?: number;
  onChange?: (value: number) => void;
  mode?: AbacusMode;
  readOnly?: boolean;
  compact?: boolean;
  theme?: AbacusTheme;
  showValue?: boolean;
  orientation?: AbacusOrientation;
  colorScheme?: AbacusColorScheme;
  onBeadSound?: (isUpper: boolean) => void;
}

/**
 * Professional Soroban Abacus Simulator
 * 13-column colorful design matching reference image
 * Responsive: Large on desktop, medium on tablet, compact on mobile
 */
export const RealisticAbacus = ({
  columns = 13,
  value: controlledValue,
  onChange,
  mode = 'beginner',
  readOnly = false,
  compact = false,
  showValue: showValueProp,
  orientation = 'horizontal',
  colorScheme = 'classic',
  onBeadSound: customBeadSound,
}: RealisticAbacusProps) => {
  const { playSound } = useSound();
  const deviceType = useDeviceType();
  
  const showValue = showValueProp ?? (mode === 'beginner');
  
  // Get color palette based on scheme
  const colorPalette = useMemo(() => getColorPaletteForScheme(colorScheme), [colorScheme]);
  
  // Responsive bead size: Large on desktop, medium on tablet, compact on mobile
  const getBeadSize = (cols: number): number => {
    if (deviceType === 'mobile') {
      if (cols <= 5) return 40;
      if (cols <= 9) return 34;
      if (cols <= 13) return 28;
      return 22;
    }
    if (deviceType === 'tablet') {
      if (cols <= 5) return 54;
      if (cols <= 9) return 46;
      if (cols <= 13) return 40;
      return 34;
    }
    // Desktop: large sizes
    if (cols <= 5) return 76;
    if (cols <= 9) return 66;
    if (cols <= 13) return 58;
    return 50;
  };
  
  const [internalColumns, setInternalColumns] = useState<ColumnState[]>(() => {
    return calculateColumnsFromValue(controlledValue ?? 0, columns);
  });
  
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalColumns(calculateColumnsFromValue(controlledValue, columns));
    }
  }, [controlledValue, columns]);
  
  function calculateColumnsFromValue(num: number, colCount: number): ColumnState[] {
    const cols: ColumnState[] = [];
    for (let i = 0; i < colCount; i++) {
      const digit = Math.floor((num / Math.pow(10, i)) % 10);
      cols.push({
        upper: digit >= 5,
        lower: digit % 5,
      });
    }
    return cols;
  }
  
  const calculateValueFromColumns = useCallback((cols: ColumnState[]): number => {
    return cols.reduce((sum, col, index) => {
      const digit = (col.upper ? 5 : 0) + col.lower;
      return sum + digit * Math.pow(10, index);
    }, 0);
  }, []);
  
  const currentColumns = controlledValue !== undefined
    ? calculateColumnsFromValue(controlledValue, columns)
    : internalColumns;
  
  const currentValue = useMemo(() => 
    calculateValueFromColumns(currentColumns),
    [currentColumns, calculateValueFromColumns]
  );
  
  const updateColumn = useCallback((columnIndex: number, updates: Partial<ColumnState>) => {
    if (readOnly) return;
    
    const newColumns = [...currentColumns];
    newColumns[columnIndex] = { ...newColumns[columnIndex], ...updates };
    
    const newValue = calculateValueFromColumns(newColumns);
    
    if (controlledValue === undefined) {
      setInternalColumns(newColumns);
    }
    
    onChange?.(newValue);
  }, [currentColumns, controlledValue, onChange, readOnly, calculateValueFromColumns]);
  
  const handleUpperChange = useCallback((columnIndex: number, active: boolean) => {
    updateColumn(columnIndex, { upper: active });
  }, [updateColumn]);
  
  const handleLowerChange = useCallback((columnIndex: number, count: number) => {
    const currentCol = currentColumns[columnIndex];
    
    if (count > 4 && !currentCol.upper) {
      updateColumn(columnIndex, { lower: count - 5, upper: true });
    } else if (count < 0 && currentCol.upper) {
      updateColumn(columnIndex, { lower: 4 + count, upper: false });
    } else {
      updateColumn(columnIndex, { lower: Math.max(0, Math.min(4, count)) });
    }
  }, [currentColumns, updateColumn]);
  
  const handleBeadSound = useCallback((isUpper: boolean) => {
    if (customBeadSound) {
      customBeadSound(isUpper);
    } else {
      playSound(isUpper ? 'beadHigh' : 'bead');
    }
  }, [playSound, customBeadSound]);
  
  // Dynamic bead size based on columns
  const beadSize = compact ? Math.min(28, getBeadSize(columns)) : getBeadSize(columns);
  
  // Dynamic gap based on columns
  const getGap = (cols: number): number => {
    if (cols <= 5) return 12;
    if (cols <= 9) return 8;
    if (cols <= 13) return 6;
    return 4;
  };
  
  const isVertical = orientation === 'vertical';
  
  return (
    <div className={cn(
      "flex items-center w-full",
      isVertical ? "flex-row justify-center overflow-y-auto" : "flex-col overflow-x-auto px-4 sm:px-6 lg:px-8"
    )}>
      {/* Abacus frame - dark slate gray matching reference */}
      <motion.div 
         className="relative rounded-3xl overflow-hidden"
        style={{
           background: colorPalette.frame || 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
           padding: compact ? 20 : 40,
          boxShadow: `
             0 25px 50px -12px rgba(0,0,0,0.7),
             0 0 0 4px rgba(255,255,255,0.05),
             inset 0 2px 4px rgba(255,255,255,0.1)
          `,
           border: '6px solid rgba(255,255,255,0.08)',
           borderRadius: '24px',
          transform: isVertical ? 'rotate(90deg)' : 'none',
          transformOrigin: 'center center',
        }}
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         transition={{ duration: 0.5, type: 'spring' }}
      >
        {/* Inner frame border */}
        <div 
           className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
             background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
          }}
        />
        
        {/* Columns container */}
        <div 
          className="relative flex justify-center items-stretch"
          style={{ 
            gap: getGap(columns),
            padding: compact ? '16px 24px' : '28px 48px',
          }}
        >
          {/* Columns in reverse order (largest place value on left) */}
          {[...Array(columns)].map((_, i) => {
            const columnIndex = columns - 1 - i;
            const col = currentColumns[columnIndex] || { upper: false, lower: 0 };
            
            return (
              <AbacusColumn
                key={columnIndex}
                columnIndex={columnIndex}
                totalColumns={columns}
                upperActive={col.upper}
                lowerCount={col.lower}
                onUpperChange={(active) => handleUpperChange(columnIndex, active)}
                onLowerChange={(count) => handleLowerChange(columnIndex, count)}
                beadSize={beadSize}
                showLabel={mode === 'beginner'}
                disabled={readOnly}
                onBeadSound={handleBeadSound}
                upperBeadColor={colorPalette.upperBead}
                lowerBeadColors={colorPalette.lowerBeads}
              />
            );
          })}
        </div>
        
        {/* Frame corner decorations */}
         <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/10 rounded-tl-lg" />
         <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/10 rounded-tr-lg" />
         <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/10 rounded-bl-lg" />
         <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/10 rounded-br-lg" />
      </motion.div>
      
      {/* Value display */}
      {showValue && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentValue}
             initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.8, opacity: 0, y: 20 }}
             transition={{ duration: 0.3, type: 'spring' }}
            className="mt-4 sm:mt-5"
          >
            <div className={cn(
              "px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl",
               "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20",
               "backdrop-blur-sm",
               "border-2 border-primary/40",
               "shadow-lg shadow-primary/20"
            )}>
               <span className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {currentValue.toLocaleString()}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default RealisticAbacus;
