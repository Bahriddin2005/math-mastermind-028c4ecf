import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AbacusColumn } from './AbacusColumn';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

export type AbacusMode = 'beginner' | 'mental' | 'test';
export type AbacusTheme = 'classic' | 'modern' | 'kids';

interface ColumnState {
  upper: boolean;
  lower: number; // 0-4
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
  upperBeadColor?: 'red' | 'green' | 'blue' | 'brown';
  lowerBeadColor?: 'red' | 'green' | 'blue' | 'brown';
}

/**
 * Professional Soroban Abacus Simulator
 * 
 * Xususiyatlar:
 * - Real Soroban qoidalari
 * - Drag & drop bilan tosh harakati
 * - Touch va mouse support
 * - 3 xil rejim: Beginner, Mental, Test
 * - Smooth animatsiyalar
 * - Real yog'och tekstura
 */
export const RealisticAbacus = ({
  columns = 3,
  value: controlledValue,
  onChange,
  mode = 'beginner',
  readOnly = false,
  compact = false,
  theme = 'classic',
  showValue: showValueProp,
  upperBeadColor = 'red',
  lowerBeadColor = 'green',
}: RealisticAbacusProps) => {
  const { playSound } = useSound();
  
  // Calculate showValue based on mode if not explicitly set
  const showValue = showValueProp ?? (mode === 'beginner');
  
  // Ustunlar holati
  const [internalColumns, setInternalColumns] = useState<ColumnState[]>(() => {
    return calculateColumnsFromValue(controlledValue ?? 0, columns);
  });
  
  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalColumns(calculateColumnsFromValue(controlledValue, columns));
    }
  }, [controlledValue, columns]);
  
  // Qiymatdan ustunlarni hisoblash
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
  
  // Ustunlardan qiymatni hisoblash
  const calculateValueFromColumns = useCallback((cols: ColumnState[]): number => {
    return cols.reduce((sum, col, index) => {
      const digit = (col.upper ? 5 : 0) + col.lower;
      return sum + digit * Math.pow(10, index);
    }, 0);
  }, []);
  
  // Joriy qiymat
  const currentColumns = controlledValue !== undefined
    ? calculateColumnsFromValue(controlledValue, columns)
    : internalColumns;
  
  const currentValue = useMemo(() => 
    calculateValueFromColumns(currentColumns),
    [currentColumns, calculateValueFromColumns]
  );
  
  // Ustunni yangilash
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
  
  // Yuqori tosh o'zgarishi
  const handleUpperChange = useCallback((columnIndex: number, active: boolean) => {
    updateColumn(columnIndex, { upper: active });
  }, [updateColumn]);
  
  // Pastki toshlar o'zgarishi
  const handleLowerChange = useCallback((columnIndex: number, count: number) => {
    const currentCol = currentColumns[columnIndex];
    
    // Avtomatik carry logikasi: 4 tadan keyin +1 = yuqori tosh aktiv
    if (count > 4 && !currentCol.upper) {
      updateColumn(columnIndex, { lower: count - 5, upper: true });
    } else if (count < 0 && currentCol.upper) {
      updateColumn(columnIndex, { lower: 4 + count, upper: false });
    } else {
      updateColumn(columnIndex, { lower: Math.max(0, Math.min(4, count)) });
    }
  }, [currentColumns, updateColumn]);
  
  // Tovush effekti
  const handleBeadSound = useCallback((isUpper: boolean) => {
    playSound(isUpper ? 'beadHigh' : 'bead');
  }, [playSound]);
  
  // Reset funksiyasi
  const reset = useCallback(() => {
    const resetColumns = Array(columns).fill(null).map(() => ({
      upper: false,
      lower: 0,
    }));
    
    if (controlledValue === undefined) {
      setInternalColumns(resetColumns);
    }
    
    onChange?.(0);
  }, [columns, controlledValue, onChange]);
  
  // Bead size based on compact mode and screen
  const beadSize = compact ? 36 : 44;
  
  // Theme styles
  const frameStyles = {
    classic: 'from-amber-700 via-amber-800 to-amber-900',
    modern: 'from-slate-700 via-slate-800 to-slate-900',
    kids: 'from-purple-500 via-pink-500 to-orange-400',
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      {/* Abakus ramkasi */}
      <motion.div 
        className={cn(
          "relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5",
          "bg-gradient-to-b shadow-2xl",
          frameStyles[theme]
        )}
        style={{
          boxShadow: `
            0 20px 40px -10px rgba(0,0,0,0.4),
            inset 0 2px 10px rgba(255,255,255,0.1),
            inset 0 -2px 10px rgba(0,0,0,0.2)
          `,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Yog'och tekstura overlay */}
        <div 
          className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 10h100M0 20h100M0 30h100M0 40h100M0 50h100M0 60h100M0 70h100M0 80h100M0 90h100' stroke='%23000' stroke-width='0.5' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
          }}
        />
        
        {/* Yuqori dekorativ chiziq */}
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent rounded-full" />
        
        {/* Ustunlar konteyner */}
        <div className={cn(
          "relative flex justify-center items-stretch",
          compact ? "gap-2 sm:gap-3" : "gap-3 sm:gap-4 md:gap-5"
        )}>
          {/* Ustunlarni teskari tartibda ko'rsatish (katta xona -> kichik xona) */}
          {[...Array(columns)].map((_, i) => {
            const columnIndex = columns - 1 - i;
            const col = currentColumns[columnIndex] || { upper: false, lower: 0 };
            
            return (
              <AbacusColumn
                key={columnIndex}
                columnIndex={columnIndex}
                upperActive={col.upper}
                lowerCount={col.lower}
                onUpperChange={(active) => handleUpperChange(columnIndex, active)}
                onLowerChange={(count) => handleLowerChange(columnIndex, count)}
                beadSize={beadSize}
                showLabel={mode === 'beginner'}
                disabled={readOnly}
                onBeadSound={handleBeadSound}
                beadColor={upperBeadColor}
                lowerBeadColor={lowerBeadColor}
              />
            );
          })}
        </div>
        
        {/* Pastki dekorativ chiziq */}
        <div className="absolute bottom-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent rounded-full" />
      </motion.div>
      
      {/* Qiymat ko'rsatkichi */}
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
