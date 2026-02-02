import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AbacusColumn } from './AbacusColumn';
import { useSound } from '@/hooks/useSound';
import { useDeviceType } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
}: RealisticAbacusProps) => {
  const { playSound } = useSound();
  const deviceType = useDeviceType();
  
  const showValue = showValueProp ?? (mode === 'beginner');
  
  // Responsive bead size: Large on desktop, medium on tablet, compact on mobile
  const getBeadSize = (cols: number): number => {
    if (deviceType === 'mobile') {
      // Mobile: compact sizes
      if (cols <= 5) return 32;
      if (cols <= 9) return 26;
      if (cols <= 13) return 22;
      return 18;
    }
    if (deviceType === 'tablet') {
      // Tablet: medium sizes
      if (cols <= 5) return 44;
      if (cols <= 9) return 38;
      if (cols <= 13) return 34;
      return 28;
    }
    // Desktop: large sizes
    if (cols <= 5) return 64;
    if (cols <= 9) return 56;
    if (cols <= 13) return 48;
    return 42;
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
    playSound(isUpper ? 'beadHigh' : 'bead');
  }, [playSound]);
  
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
      isVertical ? "flex-row justify-center overflow-y-auto" : "flex-col overflow-x-auto"
    )}>
      {/* Abacus frame */}
      <motion.div 
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
          padding: compact ? 16 : 32,
          boxShadow: `
            0 20px 40px -10px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `,
          transform: isVertical ? 'rotate(90deg)' : 'none',
          transformOrigin: 'center center',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Inner frame border */}
        <div 
          className="absolute inset-2 rounded-xl pointer-events-none"
          style={{
            border: '2px solid rgba(255,255,255,0.08)',
          }}
        />
        
        {/* Columns container */}
        <div 
          className="relative flex justify-center items-stretch"
          style={{ 
            gap: getGap(columns),
            padding: compact ? '16px 4px' : '28px 8px',
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
              />
            );
          })}
        </div>
        
        {/* Frame decorative dots */}
        <div className="absolute top-3 right-3 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-600"
            />
          ))}
        </div>
      </motion.div>
      
      {/* Value display */}
      {showValue && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentValue}
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 sm:mt-5"
          >
            <div className={cn(
              "px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl",
              "bg-card/90 backdrop-blur-sm",
              "border-2 border-primary/30",
              "shadow-lg"
            )}>
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
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
